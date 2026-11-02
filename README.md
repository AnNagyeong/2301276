# 상권.zip

예비 창업자가 지역별 점포 분포와 경쟁 환경을 비교하는 공공데이터 분석 웹앱입니다. Vanilla JavaScript ES Modules, HTML/CSS, Chart.js, Leaflet/OpenStreetMap, Node.js 24로 구현했습니다.

## 실행

```sh
npm ci
npm test
# .env.example을 .env로 복사하고 Decoding 인증키 입력
npm run collect
npm run build
npm run dev
```

브라우저에서 http://127.0.0.1:4173 을 엽니다. HTML 파일을 직접 더블클릭하면 모듈/Fetch가 작동하지 않습니다. 키 없이도 빈 상태와 내비게이션을 확인할 수 있으나 통계는 제공되지 않습니다. Node 24의 --env-file-if-exists로 .env를 읽습니다.

## 공공데이터와 구조

공식 출처: [소상공인시장진흥공단 상가(상권)정보 API](https://www.data.go.kr/data/15012005/openapi.do).

수집 호출: `https://apis.data.go.kr/B553077/api/open/sdsc2/storeListInRadius`.
요청: ServiceKey, radius(1000m), cx(경도), cy(위도), numOfRows(1000), pageNo, type(json 또는 xml). 환경변수 API_FORMAT=xml로 XML 수집도 가능합니다. 필드 bizesId, bizesNm, lat, lon, indsSclsCd, indsSclsNm, rdnmAdr/lnoAdr를 사용합니다.

`GitHub Secret → Actions/Node 수집 → 페이지네이션 → 고유 ID 중복 제거/검증 → 버전별 JSON → Pages 브라우저 → 분석 모듈 → 지도/차트/표`.

키는 수집 프로세스에만 전달하며 정적 사이트에는 포함하지 않습니다. 브라우저는 API에 직접 접근하지 않으므로 API CORS 허용에 의존하지 않습니다. 실제 키를 이용한 인증 및 API CORS 헤더 확인은 아직 수행하지 않았습니다. 2026-11-02 공식 포털 HTML에 내장된 Swagger 명세에서 엔드포인트, ServiceKey(대소문자 포함), 요청 및 응답 필드를 확인했습니다. 인증키로 첫 수집 시 현재 계약과 응답 구조를 최종 검증해야 합니다. 응답이 예상 계약과 다르면 통계를 생성하지 않고 오류로 처리합니다.

각 지역 전체 페이지와 totalCount 일치를 확인한 뒤 모든 지역의 수집 배치가 성공해야 metadata.json을 교체합니다. 원천 데이터는 수집 중 변할 수 있어 엄밀한 동일 시점 스냅샷을 보장하지 못합니다. 최대 100페이지/지역, 호출 사이 250ms, 요청당 30초 제한을 두었습니다. 계정별 실제 한도와 최신 이용조건을 확인하세요. 오류 원문/요청 URL은 로그에 출력하지 않습니다.

성수역·홍대입구역·강남역 1km 고정 수집이며 data/regions.json에서 범위를 설정합니다. 임의 위치 검색은 지원하지 않습니다. 업종은 실제 수집된 소분류 코드로만 선택합니다. 전체 건수·수집 건수·유효 건수·중복/제외 건수를 구분합니다. 원천 기준년월은 stdrYm으로 수집하며 응답에서 확인되지 않으면 '제공되지 않음'으로 표시합니다. 빈 응답과 미수집은 별개 상태입니다.

## 알고리즘

- Haversine: 지구 반경 6,371km를 사용한 구면 직선거리. 반경 경계 포함.
- 경쟁 밀도: 선택 소분류 점포 수 / π×반경(km)². 실제 점포 수와 별도 표시.
- 다양성: 소분류 비중 p로 H=−Σp ln p. 관측된 소분류 수 k에 대해 H/ln(k). k=1은 0, 무점포는 계산 불가. 관측 업종 수가 다른 지역의 정규화 수치 해석에 주의.
- 상대 비교: A−B와 (A−B)/B×100. B=0이면 백분율 계산 불가.

## 화면과 기능

- index.html: 소개, 지역/실제 업종/300·500·1000m 반경 선택, 중심 지도, 이전 검색 LocalStorage 저장.
- analysis.html: KPI 4개, 반경 원과 점포 마커, 선택 업종 필터, 업종 분포 차트와 접근 가능한 표, 해석, CSV 내보내기.
- compare.html: 동일 반경과 소분류로 두 지역 비교, 경쟁업체 막대그래프, 밀도·다양성·전체 점포 비교표, 상대 차이 해석.

외부 CDN/지도 타일과 폰트에 네트워크 연결이 필요합니다. 라이브러리가 로드되지 않으면 오류 안내와 수치 표를 제공합니다. 매출·폐업·성공률은 예측하지 않습니다. 제외 데이터가 있는 경우 유효 데이터에 한정된 통계입니다.

## GitHub Pages 배포

대상 저장소: https://github.com/AnNagyeong/2301276

1. 프로젝트 파일을 저장소 루트에 업로드합니다. 기존 파일은 검토 후 병합하세요.
2. Settings → Secrets and variables → Actions → New repository secret에 `DATA_GO_KR_KEY`를 Decoding 키로 등록합니다. 키를 채팅/소스/정적 JSON에 넣지 마세요.
3. Settings → Pages → Source를 **GitHub Actions**로 설정합니다.
4. Actions → Collect and deploy Pages → Run workflow를 실행합니다. main push도 실행됩니다.
5. 성공한 배포의 URL로 세 페이지 이동, 수집 시각, 지도/차트를 검증합니다. `/2301276/` 하위 경로를 지원하도록 상대 경로를 사용했습니다.

실패 시 Actions 캐시의 마지막 정상 수집본을 유지하고 경고를 표시합니다. 캐시가 만료되면 이전 데이터를 복구하지 못하므로 미수집/오류 상태가 표시됩니다. 캐시는 영구 저장소가 아닙니다. API 데이터는 Git에 자동 커밋하지 않습니다. 배포 산출물은 HTML/css/js/data만 포함하고 .env 및 Node 코드를 제외합니다. 자동 정기 수집은 설정하지 않았으며 수동 워크플로로 갱신할 수 있습니다.

## 검증 및 한계

`npm test`는 거리, 경계, 밀도, 엔트로피, 무데이터, 중복/좌표, 0분모, JSON/XML, 오류 응답, 페이지네이션을 검사합니다. 테스트 fixture는 가상 단위 테스트 데이터이며 UI 데이터로 배포하지 않습니다. 실제 키 기반 API 통합 검증, 실제 통계 화면의 브라우저 검증, GitHub Pages 배포 결과는 별도 확인이 필요합니다. 최종 실행 결과는 docs/verification.md에 기록합니다.

발표 초안은 docs/presentation-outline.md에 있습니다. 배포 확인 전 URL이나 실제 통계를 확정된 결과로 기재하지 않습니다.

