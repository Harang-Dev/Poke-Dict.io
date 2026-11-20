# 검색·AI 검색과 AdSense 신청 준비

점검일: 2026-11-20. 이 문서는 구현 결과와 남은 운영 작업을 구분한다. 검색 순위, AI 답변 인용, AdSense 승인이나 콘텐츠의 상업적 이용 권한을 보장하지 않는다.

## 경쟁 사이트와 선택한 방향

아래 비교는 각 사이트의 공개 페이지를 직접 확인한 범위다. 유입량·속도·검색 순위나 전체 기능을 측정한 경쟁 분석은 아니다. 다른 사이트의 설명문이나 디자인을 복사하지 않았다.

| 비교 대상 | 공개 페이지에서 확인한 강점 | Poke-Dict에 적용한 방향 |
| --- | --- | --- |
| [Pokémon Database](https://pokemondb.net/pokedex/pikachu) | 도감과 타입표·육성·기술 검색 도구가 연결된 탐색 | 타입·세대별 도감에서 상세와 실제 비교 도구로 연결 |
| [Serebii](https://www.serebii.net/pokedex-sv/pikachu/) | 작품별 도감과 여러 데이터 분류로 나뉜 탐색 | 현재 지원하는 게임별 기술·출현 정보의 확인 순서를 한국어 가이드로 설명 |
| [NationalDex](https://nationaldex.io/ko/pokemon/pikachu) | 한국어 데이터 요약, 약점·저항과 폼 링크 | 계산 근거·제외 조건을 명시한 요약과 폼별 수집·백업 안내를 함께 제공 |
| [계피디의 도구](https://www.ceasar.kr/pokedex/pikachu) | 질문형 약점·종족값 설명과 계산 도구 | 질문에 바로 답하는 약점 요약과 실제 수치 예시를 기존 비교·팀 기능에 연결 |

Poke-Dict의 방향은 한국어 검색 → 폼·상성 확인 → 비교·팀 점검 → 브라우저 컬렉션·백업이다. 다른 서비스보다 데이터가 최신이거나 더 정확하다고 주장하지 않는다. 현재 인덱스는 1,025종, 폼 포함 1,351개 항목과 기술 937개이며 새 작품의 모든 항목을 실시간 반영하지 않는다.

## 구현한 검색 기반

- 포켓몬·기술 본문, 학습 가이드와 분류 목록은 JavaScript 실행 전 HTML에도 제공한다. API 응답 실패 시에도 로컬 인덱스의 핵심 요약은 화면에 남는다.
- 메타데이터 생성 함수를 정적 HTML과 화면 이동에서 공유한다. 제목·설명·canonical·Open Graph·Twitter 카드·JSON-LD를 같은 기준으로 갱신한다.
- 구조화 데이터는 WebSite, WebPage, 화면에 보이는 BreadcrumbList, 실제 작성한 가이드의 Article만 사용한다. 리뷰·평점·상품·FAQ 검색 기능을 꾸며 넣지 않는다.
- 타입·세대별 도감 29개 페이지와 학습 가이드 목록·5편을 연결한다. 분류 목록은 포켓몬과 폼의 전체 링크를 제공한다. 세대는 종의 첫 등장 기준이며 게임별 등장 도감으로 표현하지 않는다.
- `/about/`, `/privacy/`, `/contact/`, `/guide/`에 운영 프로젝트, 데이터 출처, 계산·설명 기준, 기록 관리와 문의 방법을 안내한다.
- 개인 기록과 공유 쿼리를 사용하는 `/collection/`, `/compare/`, `/team/`, `/quiz/`, `/binder/`는 계속 `noindex`다. 검색·필터·더 보기 쿼리는 공개 목록의 기본 주소로 canonical을 통합한다.
- 공개 canonical만 sitemap에 넣으며, sitemap에 임의의 최신 수정일을 만들지 않는다. 글의 작성·수정일은 실제 편집 시 `editorialDate`와 화면 표시를 함께 관리한다.
- 1,200×630 공유 이미지는 자체 텍스트·도형으로 제작했다. 포켓몬 이미지를 새 홍보 이미지에 재사용하지 않았다.

Google의 [AI 검색 안내](https://developers.google.com/search/docs/appearance/ai-features)는 기존 SEO·접근성·유용한 콘텐츠를 기본으로 설명하며 특별한 AI 전용 구조화 데이터를 요구하지 않는다. `llms.txt`나 특정 태그가 AI 인용을 보장한다고 취급하지 않는다. 현재 robots 정책은 모든 사용자 에이전트에 접근을 허용하며 개별 AI 학습 크롤러의 허용·차단 정책은 별도로 정하지 않았다.

## 작성한 자체 가이드

1. 타입 약점과 복합 타입: 리자몽의 바위 4배·땅 무효를 데이터 계산으로 설명
2. 종족값과 실제 능력치: 피카츄·라이츄의 합계와 항목 비교, 육성 조건과 기본값의 구분
3. 폼과 컬렉션: 전국도감 번호·개별 폼·종 단위 체크·색이 다른 모습·백업의 구분
4. 팀 구성: 방어 상성표의 마릿수와 배율을 구분하고 공통 약점을 확인하는 절차
5. 버전별 데이터: 게임 선택·습득 방법·출현 조건·관동 지도 지원 범위와 데이터 누락의 해석

원본 데이터 리비전과 실제 구현을 바탕으로 작성한 설명이다. 확인되지 않은 승률이나 추천 순위, 전문가 경력을 만들지 않았다. 게시 후에도 실제 사용자 질문과 제보를 반영해 수정하는 운영이 필요하다. 글 수나 글자 수만으로 AdSense 승인을 판단하지 않는다. [AdSense 사이트 준비 안내](https://support.google.com/adsense/answer/7299563?hl=ko)

## 빌드와 검증

저장소 루트에서 실행한다.

```sh
npm test
npm run build
npm run check:site
```

`build`는 HTML과 sitemap 생성 뒤 `check:site`를 실행한다. 점검 대상은 모든 생성 HTML의 제목·단일 h1·canonical·설명·공유 메타·구조화 데이터, 모든 sitemap URL과 로컬 링크 대상, 자체 가이드·요약 본문, 광고 미실행 상태다. 생성 파일은 직접 수정하지 않는다.

`POKEDICT_SITE_URL`은 최종 HTTPS 사이트 주소이며 기본값은 `https://harang-dev.github.io/Poke-Dict.io/`다. `.env.example`을 `.env.local`로 복사해 로컬에서 설정하거나, 명령 실행 환경과 GitHub Actions 저장소 변수에 값을 설정할 수 있다. 환경 변수 값이 `.env.local`보다 우선한다.

## 도메인 루트에서 해야 하는 일

`robots.txt`와 `ads.txt`는 프로젝트 경로인 `/Poke-Dict.io/` 아래에 두어도 호스트 루트 파일을 대신하지 못한다.

- 사이트 주소가 도메인 루트라면 빌드가 `dist/robots.txt`를 생성한다.
- GitHub Pages 프로젝트 주소라면 `deployment-root/robots.txt`를 생성한다. 이 파일은 현재 Pages 배포 산출물 `dist/`에 포함되지 않는다. 계정의 사용자 사이트 등 **실제로 `https://harang-dev.github.io/` 루트를 배포하는 위치**에 따로 반영해야 한다.
- 호스트에 이미 다른 프로젝트의 robots 정책이나 sitemap 선언이 있으면 덮어쓰지 말고 합쳐야 한다.
- Search Console에 제출할 기본 sitemap 주소는 `https://harang-dev.github.io/Poke-Dict.io/sitemap.xml`이다. 실제 도메인이 바뀌면 그 주소에 맞춰 다시 빌드한다.
- 도메인을 변경하면 브라우저 저장 원본도 바뀐다. 기존 이용자는 변경 전에 컬렉션을 백업해 두고 새 주소에서 가져와야 한다.

프로젝트 경로의 robots 파일이 루트 정책을 제어한다고 표시하지 않는다. [Google robots 범위](https://developers.google.com/search/docs/crawling-indexing/robots/robots_txt), [Google ads.txt 안내](https://support.google.com/adsense/answer/7532444)

현재 `harang-dev.github.io`의 루트 파일은 [사용자 사이트 저장소](https://github.com/Harang-Dev/Harang-Dev.github.io)의 `main` 브랜치에서 별도로 배포한다. `robots.txt`에는 Poke-Dict sitemap을 선언했고, `ads.txt`에는 기존 AdSense 게시자를 선언했다. Poke-Dict의 `POKEDICT_ADSENSE_PUBLISHER_ID` 저장소 변수도 같은 계정으로 설정했다. 이후 게시자나 호스트 정책이 바뀌면 두 저장소의 설정을 함께 확인해야 한다.

## AdSense 연결 직전 상태

현재 광고 코드, 광고 요청, 광고 개인화 쿠키, 방문 분석 스크립트를 추가하지 않았다. 빈 광고 슬롯이나 시험용 게시자 ID도 배포하지 않는다.

실제 계정에서 받은 ID를 `POKEDICT_ADSENSE_PUBLISHER_ID`에 넣으면:

1. `ca-pub-`와 숫자 16자리 형식을 검증한다. 형식 검증은 계정 소유나 승인을 확인하는 절차가 아니다.
2. 모든 HTML에 `google-adsense-account` 소유 확인 메타 태그를 넣는다.
3. 루트 배포라면 `dist/ads.txt`, 프로젝트 경로라면 `deployment-root/ads.txt`를 생성한다.
4. 광고 스크립트는 계속 실행하지 않는다. 사이트 심사 요청과 광고 게재는 별도 단계다.

ID를 비워 두면 확인 메타와 ads.txt를 만들지 않는다. 이전 빌드의 `deployment-root/`를 지워 다른 환경·계정의 파일이 남지 않게 한다. GitHub Actions에서도 같은 이름의 저장소 변수를 사용할 수 있다. [Google 사이트 연결](https://support.google.com/adsense/answer/7584263), [소유 확인과 사이트 심사](https://support.google.com/adsense/answer/12131223)

## 신청 전에 운영자가 확인할 남은 항목

- [x] 현재 GitHub Pages 주소에 사이트와 호스트 루트 파일을 게시했다. 이후 도메인을 변경하면 새 호스트 기준으로 다시 확인해야 한다.
- [ ] Search Console 소유 확인과 sitemap 제출 후 대표 페이지의 색인·렌더링 결과를 확인한다. 이 저장소는 계정 연결이나 실제 색인 상태를 증명하지 않는다.
- [ ] Pokémon 명칭·스프라이트·울음소리 등의 광고 수익화에 필요한 이용 권한을 확인한다. PokéAPI 데이터 라이선스나 출처 표시는 이미지·상표의 상업적 이용 허락을 자동으로 의미하지 않는다. 현재 권리자 허락을 확인한 상태가 아니다. [Pokémon 권리 안내](https://www.pokemon.com/us/legal/information), [Google 지식재산 정책](https://support.google.com/adsense/answer/10502938?hl=en)
- [ ] GitHub Pages의 이용 범위와 콘텐츠 권리·개인정보 정책을 지키는 운영인지 확인한다. 개인 도메인을 연결해도 GitHub Pages 이용 조건은 바뀌지 않는다. [GitHub 광고 정책](https://docs.github.com/en/site-policy/acceptable-use-policies/github-acceptable-use-policies#10-advertising-on-github), [Pages 제한](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits)
- [ ] 실제 AdSense 계정의 자격 요건·게시자 ID·지급 국가 등 계정 정보를 운영자가 확인하고 사이트를 등록한다.
- [ ] 광고를 실제 실행하기 전 사용할 공급자·광고 방식·이용자 지역에 맞춰 개인정보 안내, 쿠키·동의와 거부 절차를 보완한다. 현재의 ‘광고 스크립트 없음’ 문구도 그때 실제 동작에 맞게 수정한다. [Google 필수 고지](https://support.google.com/adsense/answer/1348695), [EU 사용자 동의 정책](https://www.google.com/about/company/user-consent-policy/)

기술 준비와 심사 통과는 별개다. 승인은 Google의 검토 결과이며, 이 문서에 적은 미확인 항목을 구현 완료로 표시하지 않는다.
