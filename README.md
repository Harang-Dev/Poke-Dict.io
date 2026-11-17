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
