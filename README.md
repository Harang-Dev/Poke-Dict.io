# 📖 Poke API를 사용한 포켓몬 사전

<img width="1491" alt="스크린샷 2025-02-05 오후 4 15 39" src="https://github.com/user-attachments/assets/bbe5dee7-630f-4d3b-8387-c6214c01f1ca" />

<br>

- 배포 URL : [Poke-Dict](https://harang-dev.github.io/Poke-Dict.io/)

<br>

## 프로젝트 소개

- **Poke API**라는 Open API를 활용한 포켓몬 도감 프로젝트입니다.
- TanStack Query의 `useInfiniteQuery`를 사용하여 **무한 스크롤** 기능을 구현했습니다.
- API를 RESTful 형식으로 받아와 필요한 데이터를 렌더링했습니다.
- 모바일과 데스크탑에서 함께 볼 수 있게끔 **반응형 웹**으로 구현했습니다.


<br>

## 팀원 구성

<div align="center">

| **서현우** |
| :------: |
| [<img src="https://avatars.githubusercontent.com/u/90229940?v=4" height=150 width=150> <br/> @Harang-Dev](https://github.com/Harang-Dev) |

</div>

<br>

## 1. 개발 환경

- **Front-end**: React, Vite, TanStack Query, React Router
- **API**: [Poke API](https://pokeapi.co/)
- **버전 및 이슈 관리**: GitHub, GitKraken
- **서비스 배포 환경**: GitHub Pages

<br>

## 2. 채택한 개발 기술과 브랜치 전략

### React

- **React**
  - 컴포넌트 단위로 개발하여 유지보수가 용이합니다.

### TanStack Query

- `useInfiniteQuery`를 활용하여 **무한 스크롤 기능**을 구현했습니다.
- API 모듈화를 통해 **데이터 관리**를 효과적으로 처리했습니다.

<br>

## 3. 역할 분담

### 서현우

- **UI 구현**
  - 모든 페이지 개발
- **기능 개발**
  - 무한 스크롤, Flip 애니메이션, 상세 페이지 데이터 렌더링

<br>

## 4. 개발 기간 및 작업 관리

### 🕒 개발 기간

- **전체 개발 기간**: 2025-01-25 ~ 2025-01-31
- **UI 구현**: 2025-01-25 ~ 2025-01-26
- **기능 구현**: 2025-01-27 ~ 2025-01-30

<br>

### 🛠 작업 관리

- GitHub 및 GitKraken을 활용하여 **버전 관리**를 진행했습니다.

<br>

## 5. 로컬 실행 및 배포

Node.js 24.15 이상(24.x)을 사용합니다.

```sh
npm ci
npm run dev
npm test
npm run build
npm run preview
npm audit
```

개발과 미리보기는 서버가 안내하는 `/Poke-Dict.io/` 경로에서 열 수 있습니다.
포켓몬 상세 주소는 `/Poke-Dict.io/#/pokemon/1` 형식입니다.

GitHub 저장소의 **Settings → Pages → Source**를 **GitHub Actions**로 설정하면
`main`에 반영된 커밋을 테스트하고, 빌드에 성공한 `dist/`를 Pages에 배포합니다.
`main`을 대상으로 하는 PR에서는 테스트와 빌드를 실행합니다.

## 6. 도감 기능과 데이터 범위

- 도감에서 한국어·영어 이름, 전국도감 번호, 개별 폼 ID를 검색할 수 있습니다. 타입·세대·받는 기술의 타입 약점으로 좁히고, 카드 또는 표 보기로 전환할 수 있습니다.
- 마우스를 올리면 카드 전체가 뒤집힙니다. 카드를 누르면 상세 페이지가 열립니다.
- 즐겨찾기, 바인더, 잡은 포켓몬, 색이 다른 모습, 최근 본 포켓몬과 팀은 현재 브라우저에 저장됩니다. 백업을 가져오면 현재 기록과 합쳐집니다. 공유 링크에는 선택한 검색 조건이나 비교 ID, 바인더 제목과 순서만 들어갑니다.
- 전국도감은 종 단위, 즐겨찾기와 바인더는 폼 단위입니다. 지역 완성률은 해당 지역 도감에 올라 있는 종을 기준으로 계산합니다. 색이 다른 모습의 도감 완성률은 기본 폼 기준이며, 다른 폼의 수집 기록은 각 상세에서 관리합니다.
- 타입 상성과 팀 방어는 도감의 기본 타입 기준입니다. 기술·출현 목록은 선택한 게임을 기준으로 표시하며, 기술 상세의 위력·명중률·PP는 PokéAPI의 기본값입니다. 출현 지도는 좌표를 대조한 관동의 레드·블루에서 지원합니다. 일반·색이 다른 모습 이미지, 울음소리, 한국어 설명은 원본 데이터가 있는 항목에 표시됩니다.

### 도감 데이터 갱신

검색·비교·필터에는 [PokéAPI CSV의 고정 리비전](https://github.com/PokeAPI/pokeapi/tree/8d8a49d9295bbc951d882004570ca496866fd9d8/data/v2/csv)에서 생성한 `src/data/`의 인덱스를 사용합니다. 처음 목록을 열 때 개별 Pokémon API 요청을 보내지 않으며, 상세의 게임별 데이터는 화면을 요청할 때 불러옵니다.

동일 리비전의 저장소를 받아 아래 명령으로 인덱스를 재생성합니다.

```sh
python3 scripts/generate-dex.py /path/to/pokeapi/data/v2/csv
```

출현 지도는 [pret/pokered 타운맵 좌표](https://github.com/pret/pokered/blob/ba9c0568f64ae602fadda577a08c66639f93082a/data/maps/town_map_entries.asm)와 PokéAPI의 장소 데이터를 사용합니다. [PokéAPI 데이터 고지](public/pokeapi-license.txt)
