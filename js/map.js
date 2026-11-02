export function makeMap(id,center,radius=1000){
 if(!globalThis.L){document.getElementById(id).textContent='지도를 불러오지 못했습니다. 네트워크 연결을 확인하세요.';return null;}
 const map=L.map(id,{preferCanvas:true}).setView([center.lat,center.lon],15);L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',maxZoom:19}).addTo(map);
 const circle=L.circle([center.lat,center.lon],{radius,color:'#2865ed',weight:2,fillOpacity:.05}).addTo(map);map.fitBounds(circle.getBounds());return map;
}
export function markers(map,rows,code){if(!map)return null;const layer=L.layerGroup().addTo(map);for(const s of rows){const node=document.createElement('div');const title=document.createElement('strong');title.textContent=s.name;node.append(title,document.createElement('br'),document.createTextNode(s.category+' · '+s.address));L.circleMarker([s.lat,s.lon],{radius:5,color:s.code===code?'#2865ed':'#16a998',weight:1,fillOpacity:.8}).bindPopup(node).addTo(layer);}return layer;}
