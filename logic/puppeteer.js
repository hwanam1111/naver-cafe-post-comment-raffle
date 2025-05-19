const puppeteer = require('puppeteer');
const _ = require('lodash');

const SELECTORS = {
  commentBox: 'ul.comment_list > li.CommentItem',
  nickname: 'a.comment_nickname',
  content: 'span.text_comment',
  profileUrl: 'a.comment_thumb',
};

function getChromePath() {
  const isWin = process.platform === 'win32';
  const isMac = process.platform === 'darwin';

  if (isWin) {
    return 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  }

  if (isMac) {
    return '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  }

  throw new Error('Chrome 설치 경로를 찾을 수 없습니다.');
}


module.exports = async function runPuppeteer({ url, keyword, winnerCount, postMin, excludeList }, log = () => {}, setBrowserRef = () => {}) {
  const excludeSet = new Set(
    excludeList.split(',').map(name => name.trim()).filter(Boolean)
  );

  let browser;
  let browserDisconnected = false;

  try {
    browser = await puppeteer.launch({
      headless: false,
      // executablePath: puppeteer.executablePath(),
      executablePath: getChromePath(),
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    setBrowserRef(browser);

    browser.on('disconnected', () => {
      browserDisconnected = true;
    });

    const page = await browser.newPage();

    log('🔐 네이버 로그인 페이지로 이동 중...');
    await page.goto('https://nid.naver.com/nidlogin.login');
    if (browserDisconnected) return '❌ 브라우저가 종료되었습니다. 추첨을 다시 시도해주세요.';

    log('👤 로그인 완료 후 5분 내에 계속됩니다...');
    const loginDone = await waitForLogin(page);
    if (!loginDone || browserDisconnected) {
      return '❌ 로그인 타임아웃 또는 브라우저가 닫혔습니다.';
    }

    log('✅ 로그인 성공! 게시글로 이동 중...');
    try {
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 10000 });
      if (browserDisconnected) return '❌ 브라우저가 종료되었습니다. 추첨을 다시 시도해주세요.';
    } catch (err) {
      return `❌ 게시글 URL에 문제가 있어 접근할 수 없습니다.\n▶ 입력한 URL: ${url}`;
    }

    const frame = await (await page.$('iframe#cafe_main')).contentFrame();
    await frame.waitForSelector(SELECTORS.commentBox);
    if (browserDisconnected) return '❌ 브라우저가 종료되었습니다. 추첨을 다시 시도해주세요.';

    log('💬 댓글 수집 시작...');
    const rawComments = await collectAllComments(frame, SELECTORS, keyword, log);
    if (browserDisconnected) return '❌ 브라우저가 종료되었습니다. 추첨을 다시 시도해주세요.';

    const nicknameMap = new Map();
    for (const user of rawComments) {
      if (user.content.includes(keyword) && !nicknameMap.has(user.nickname)) {
        nicknameMap.set(user.nickname, user);
      }
    }

    const keywordFiltered = [...nicknameMap.values()];
    log(`🔍 키워드 '${keyword}' 포함된 댓글 수: ${keywordFiltered.length}`);
    log('');

    const eligibleUsers = [];

    for (const user of keywordFiltered) {
      log(`🔎 ${user.nickname}님의 프로필 검사 중...`);
      try {
        const stats = await getUserStats(page, user.profileUrl);
        log(`👉 게시글 수: ${stats.posts}`);
        if (stats.posts >= postMin) eligibleUsers.push(user.nickname);
      } catch (err) {
        const msg = err.message || '';
        if (
          msg.includes('Target closed') ||
          msg.includes('Session closed') ||
          msg.includes('Execution context was destroyed')
        ) {
          return '❌ 브라우저가 종료되었습니다. 추첨을 다시 시도해주세요.';
        }
        log(`❌ ${user.nickname} 정보 조회 실패`);
      }
      if (browserDisconnected) return '❌ 브라우저가 종료되었습니다. 추첨을 다시 시도해주세요.';
      log('');
    }

    const filteredEligible = _.uniq(eligibleUsers).filter(name => !excludeSet.has(name));
    if (filteredEligible.length < winnerCount) {
      return `❌ 인원 부족: ${filteredEligible.length}명 < ${winnerCount}명`;
    }

    const winners = _.sampleSize(filteredEligible, winnerCount);
    log('🎉 최종 당첨자 🎉');
    winners.forEach((w, i) => log(`${i + 1}. ${w}`));
    log('');

    return '✅ 추첨 완료!';
  } catch (err) {
    const msg = err.message || '';
    if (
      msg.includes('Target closed') ||
      msg.includes('Session closed') ||
      msg.includes('Most likely the page has been closed')
    ) {
      return '❌ 브라우저가 종료되었습니다. 추첨을 다시 시도해주세요.';
    }
    return `❌ 알 수 없는 오류 발생: ${msg}`;
  } finally {
    if (browser) {
      try {
        await browser.close();
      } catch (_) {}
    }
  }
};


async function waitForLogin(page, timeout = 5 * 60 * 1000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const cookies = await page.cookies();
    if (cookies.find(c => c.name === 'NID_AUT')) return true;
    await new Promise(r => setTimeout(r, 1000));
  }
  return false;
}

async function getUserStats(page, profileUrl) {
  await page.goto(profileUrl, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.info_area', { timeout: 5000 });

  return page.evaluate(() => {
    const counts = document.querySelectorAll('.info_area .count');
    let posts = 0;
    counts.forEach(span => {
      const label = span.textContent || '';
      const value = parseInt(span.querySelector('em.num')?.textContent.replace(/,/g, '') || '0', 10);
      if (label.includes('작성글')) posts = value;
    });
    return { posts };
  });
}

async function collectAllComments(frame, SELECTORS, keyword, log) {
  const allCommentsMap = new Map();
  while (true) {
    await frame.waitForSelector(SELECTORS.commentBox, { timeout: 5000 });

    const comments = await frame.$$eval(SELECTORS.commentBox, (boxes, selectors) => {
      return boxes.map(box => {
        const nickname = box.querySelector(selectors.nickname)?.textContent?.trim();
        const content = box.querySelector(selectors.content)?.textContent?.replace(/\n/g, ' ').trim();
        const profilePath = box.querySelector(selectors.profileUrl)?.getAttribute('href');
        return {
          nickname,
          content,
          profileUrl: profilePath ? `https://cafe.naver.com${profilePath}` : null,
        };
      }).filter(item => item.nickname && item.content && item.profileUrl);
    }, SELECTORS);

    for (const c of comments) {
      if (c.content.includes(keyword) && !allCommentsMap.has(c.nickname)) {
        allCommentsMap.set(c.nickname, c);
      }
    }

    const currentBtn = await frame.$('.ArticlePaginate .btn.number[aria-pressed="true"]');
    if (currentBtn) {
      const nextBtn = await frame.evaluateHandle(btn => btn.nextElementSibling, currentBtn);
      const isButton = await nextBtn.evaluate(el => el?.tagName === 'BUTTON');
      if (isButton) {
        await nextBtn.click();
        await new Promise(resolve => setTimeout(resolve, 1500));
        continue;
      }
    }
    break;
  }

  return [...allCommentsMap.values()];
}