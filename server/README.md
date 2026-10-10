# 오늘의 순위 서버

의존성 없는 Node.js 서버 한 파일입니다. 하루 단위(Asia/Seoul)로 플레이 기록을 모아 순위를 돌려줍니다. 기록은 `server/data/YYYY-MM-DD.json`에 쌓입니다.

## 맥미니에서 실행

```bash
cd server
node server.js                    # http://0.0.0.0:8787
PORT=9000 ALLOW_ORIGIN=https://judy-0509.github.io node server.js
```

환경 변수: `PORT`(기본 8787), `HOST`, `DATA_DIR`, `TZ_NAME`(기본 Asia/Seoul), `ALLOW_ORIGIN`(기본 `*`).

로그인 후 자동 실행하려면 `com.krlife.leaderboard.plist`의 경로를 고친 뒤:

```bash
cp com.krlife.leaderboard.plist ~/Library/LaunchAgents/
launchctl load ~/Library/LaunchAgents/com.krlife.leaderboard.plist
```

GitHub Pages(https)에서 접속하려면 서버도 https여야 합니다. 가장 쉬운 방법은 Cloudflare Tunnel입니다.

```bash
brew install cloudflared
cloudflared tunnel --url http://localhost:8787     # 임시 주소 발급
```

고정 도메인이 있으면 `cloudflared tunnel create` 로 이름 있는 터널을 만들어 두세요.

## 게임 쪽 설정

`js/config.js`의 `apiBase`에 서버 주소를 넣습니다. 비워 두면 오늘의 순위 기능이 꺼집니다.

```js
window.KR_CONFIG = { apiBase: 'https://your-tunnel.trycloudflare.com' };
```

테스트용으로 주소 뒤에 `?api=http://localhost:8787`을 붙여 열면 그 주소가 이 브라우저에 저장됩니다. `?api=` 로 열면 지웁니다.

## API

| 메서드 | 경로 | 설명 |
| --- | --- | --- |
| GET | `/api/health` | 상태, 오늘 날짜 |
| GET | `/api/days` | 기록이 있는 날짜 목록과 건수 |
| GET | `/api/leaderboard?day=2026-10-10&key=score&limit=100&offset=0&id=…` | 순위. key: score, wealth, age, happy, income, rel. id를 주면 그 기록의 순위(`me`)도 함께 |
| POST | `/api/lives` | 기록 등록. 응답에 id와 오늘 순위 |

POST 본문 예:

```json
{ "nick": "지은", "name": "김하준", "sex": "M", "region": "경기", "birthYear": 2026, "deathAge": 86, "deathYear": 2112, "cause": "폐렴",
  "degree": "대졸", "job": "중소기업", "married": true, "kids": 1, "score": 61,
  "metrics": { "age": 86, "happy": 54.2, "rel": 58.1, "wealth": 31200, "income": 290000 }, "cohortN": 500, "cohortTop": 38, "version": "0.4" }
```

제한: 본문 8KB, IP당 10분에 40건, 하루 5만 건. 기록은 클라이언트가 보내는 값을 그대로 믿으므로 가벼운 놀이용 순위입니다. 검증이 필요하면 seed와 선택 목록을 함께 받아 서버에서 다시 시뮬레이션하는 방식으로 확장할 수 있습니다(엔진이 DOM 없이 돌아갑니다).
