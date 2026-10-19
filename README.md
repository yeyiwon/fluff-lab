# FLUFF LAB

실시간 3D 털 캐릭터를 만지고 꾸미는 웹 프로토타입입니다. 최종 디자인 승인본이 아닙니다.

- **만지기**: 누르면 눌리고, 끌면 늘어나며 놓으면 복원됩니다. 현재는 전체 몸체 변형이며 국소적인 살집/털 시뮬레이션은 아닙니다.
- **돌려보기**: 좌우 드래그로 회전합니다. 더블 클릭하면 정면으로 돌아옵니다.
- **꾸미기**: 몸체·눈·털·색상·장식. 장식은 크기·높이·색상을 조정할 수 있습니다.
- 개발 스튜디오: `?studio=1`.

## 실행과 검증

Node.js 24 및 npm을 사용합니다.

```sh
npm ci
npm run web
npm run typecheck
npm test
npm run test:customization
npm run studio:test
npm run build
```

## GitHub Pages

`main`에 push하면 `.github/workflows/pages.yml`이 검사·빌드·배포합니다. 저장소 Settings → Pages → Source를 **GitHub Actions**로 지정합니다. Pages의 base path는 배포 설정에서 자동으로 전달하므로 로컬 실행은 루트 경로를 유지합니다.

Blender 원본/백업·node_modules·빌드 출력·환경 파일은 업로드하지 않습니다. 실행용 GLB와 소스·검수 이미지는 포함합니다. 네이티브 앱과 실제 모바일 기기의 성능은 미검증입니다.

[시각 검수와 비교 자료](quality/v04/VISUAL-RESET.md) · [이전 구현 기록](VERIFICATION.md)
