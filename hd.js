/* Money City — HD graphics pack.
   Loads real assets on top of the procedural world: image-based lighting from an HDR sky, a reflective
   normal-mapped ocean, detailed ground texture, fully animated people (Mixamo rigs) who walk where the
   simulated pedestrians walk, flocks of birds and galloping horses. Everything is optional and removable. */
(function(){
  const CDN=window.HD_CDN||'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/';
  const HD={on:false,ready:false,loading:null};window.HD=HD;
  const loadScript=s=>new Promise((res,rej)=>{if(document.querySelector('script[data-hd="'+s+'"]'))return res();const e=document.createElement('script');e.src=CDN+s;e.dataset.hd=s;e.onload=res;e.onerror=rej;document.head.append(e)});
  const loadGLTF=url=>new Promise((res,rej)=>new THREE.GLTFLoader().load(url,res,undefined,rej));
  let C,WORLD,env,envTex,water,waterNorm,landMats=[],landOrig=new Map(),hemi,hemiI,people=[],birds=[],horses=[],mats=[],lastEnvT=-9,mixers=[];
  const up=new THREE.Vector3(0,1,0),m4=new THREE.Matrix4(),p3=new THREE.Vector3(),q4=new THREE.Quaternion(),s3=new THREE.Vector3(),ZERO=new THREE.Matrix4().makeScale(0,0,0);
  function status(t){if(typeof toast==='function')toast(t)}
  HD.init=async function(c,w){C=c;WORLD=w;if(HD.ready){HD.enable();return}if(HD.loading)return HD.loading;
    HD.loading=(async()=>{status('Loading HD graphics pack…');
      await loadScript('loaders/GLTFLoader.js');await loadScript('loaders/RGBELoader.js');await loadScript('utils/SkeletonUtils.js');
      // 1) image-based lighting from a real sunset sky (reflections on every PBR surface)
      const hj=await (await fetch('venice_sunset_1k.hdr.json')).json();const raw=atob(hj.b64),bytes=new Uint8Array(raw.length);for(let i=0;i<raw.length;i++)bytes[i]=raw.charCodeAt(i);
      const url=URL.createObjectURL(new Blob([bytes]));const hdr=await new Promise((res,rej)=>new THREE.RGBELoader().setDataType(THREE.UnsignedByteType).load(url,res,undefined,rej));URL.revokeObjectURL(url);
      const pm=new THREE.PMREMGenerator(C.renderer);pm.compileEquirectangularShader();envTex=pm.fromEquirectangular(hdr).texture;hdr.dispose();pm.dispose();
      // 2) ocean normal map + 3) detailed ground (desaturated so each country keeps its own land colour)
      const tl=new THREE.TextureLoader();waterNorm=await new Promise(r=>tl.load('waternormals.jpg',r));waterNorm.wrapS=waterNorm.wrapT=THREE.RepeatWrapping;waterNorm.repeat.set(90,52);
      const gImg=await new Promise(r=>{const i=new Image();i.onload=()=>r(i);i.src='grasslight-big.jpg'});const cv=document.createElement('canvas');cv.width=cv.height=512;const x=cv.getContext('2d');x.drawImage(gImg,0,0,512,512);const id=x.getImageData(0,0,512,512),d=id.data;let sum=0;for(let i=0;i<d.length;i+=4){const l=(d[i]*.3+d[i+1]*.59+d[i+2]*.11);d[i]=d[i+1]=d[i+2]=l;sum+=l}const mean=sum/(d.length/4);for(let i=0;i<d.length;i+=4){const v=Math.min(255,d[i]/mean*225);d[i]=d[i+1]=d[i+2]=v}x.putImageData(id,0,0);
      HD.ground=new THREE.CanvasTexture(cv);HD.ground.wrapS=HD.ground.wrapT=THREE.RepeatWrapping;HD.ground.repeat.set(1/22,1/22);HD.ground.anisotropy=8;
      // 4) animated people and animals
      status('Loading people & animals…');
      const [sold,xbot,horse,parrot,stork,flam]=await Promise.all(['Soldier','Xbot','Horse','Parrot','Stork','Flamingo'].map(n=>loadGLTF(n+'.gltf.json')));
      const SHIRTS=[0xc4432c,0x3a6fb0,0x2f8a55,0xd9a22e,0x6b4fb0,0xf4f1ea,0x2b3338,0xe0703f];
      for(let i=0;i<48;i++){const src=i%2?sold:xbot;const o=THREE.SkeletonUtils.clone(src.scene);o.traverse(n=>{if(n.isMesh){n.castShadow=true;n.frustumCulled=false;if(src===xbot&&n.material){n.material=n.material.clone();if(/Surface|Body|Beta_Surface/i.test(n.name)||n.material.name.includes('asdf'))n.material.color.setHex(SHIRTS[i%SHIRTS.length])}}});
        o.scale.setScalar(src===sold?.52:.52);o.visible=false;WORLD.scene.add(o);const mx=new THREE.AnimationMixer(o);const clip=n=>THREE.AnimationClip.findByName(src.animations,n)||src.animations.find(a=>a.name.toLowerCase()===n.toLowerCase());
        const walk=mx.clipAction(clip(src===sold?'Walk':'walk')),idle=mx.clipAction(clip(src===sold?'Idle':'idle')),run=mx.clipAction(clip(src===sold?'Run':'run'));walk.play();idle.play();run.play();walk.setEffectiveWeight(1);idle.setEffectiveWeight(0);run.setEffectiveWeight(0);mx.update(Math.random()*2);
        people.push({o,mx,walk,idle,run,last:null,idx:-1})}
      const flock=(g,n,sc)=>{for(let i=0;i<n;i++){const o=THREE.SkeletonUtils.clone(g.scene);o.scale.setScalar(sc);o.visible=false;o.traverse(m=>{if(m.isMesh)m.frustumCulled=false});WORLD.scene.add(o);const mx=new THREE.AnimationMixer(o);mx.clipAction(g.animations[0]).setDuration(1+Math.random()*.4).play();mx.update(Math.random());birds.push({o,mx,ph:Math.random()*6.28,r:18+Math.random()*30,h:22+Math.random()*16,sp:.25+Math.random()*.2,kind:g})}};
      flock(parrot,8,.012);flock(stork,6,.008);flock(flam,6,.009);
      for(let i=0;i<8;i++){const o=THREE.SkeletonUtils.clone(horse.scene);o.scale.setScalar(.0068);o.visible=false;o.traverse(m=>{if(m.isMesh){m.castShadow=true;m.frustumCulled=false}});WORLD.scene.add(o);const mx=new THREE.AnimationMixer(o);mx.clipAction(horse.animations[0]).play();mx.update(Math.random());horses.push({o,mx,ph:i/8*6.28})}
      WORLD.scene.traverse(o=>{if(o.isHemisphereLight)hemi=o;if(o.isMesh&&o.geometry&&o.geometry.parameters&&o.geometry.parameters.width===9000)water=o;if(o.isMesh&&o.userData&&o.userData.nation)landMats.push(o.material)});
      HD.ready=true;HD.enable();status('HD graphics on');})();return HD.loading};
  HD.enable=function(){if(!HD.ready)return;HD.on=true;WORLD.scene.environment=envTex;if(hemi){hemiI=hemiI??hemi.intensity}
    if(water){water.material.normalMap=waterNorm;water.material.normalScale=new THREE.Vector2(.6,.6);water.material.roughness=.06;water.material.metalness=.25;water.material.needsUpdate=true}
    for(const m of landMats){if(!landOrig.has(m))landOrig.set(m,m.map);m.map=HD.ground;m.needsUpdate=true}
    mats=[];WORLD.scene.traverse(o=>{if(o.material){(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>{if(m.isMeshStandardMaterial&&!mats.includes(m))mats.push(m)})}})};
  HD.disable=function(){HD.on=false;if(!HD.ready)return;WORLD.scene.environment=null;if(water){water.material.normalMap=null;water.material.roughness=.3;water.material.metalness=.15;water.material.needsUpdate=true}
    for(const [m,map] of landOrig){m.map=map;m.needsUpdate=true}if(hemi&&hemiI!=null)hemi.intensity=hemiI;people.forEach(p=>p.o.visible=false);birds.forEach(b=>b.o.visible=false);horses.forEach(h=>h.o.visible=false)};
  HD.tick=function(dt,t,camera){if(!HD.on||!HD.ready)return;dt=Math.min(dt,.1);const tg=C.controls.target,camD=camera.position.distanceTo(tg);
    // daylight scales the sky reflections (no golden glow at midnight)
    if(t-lastEnvT>1){lastEnvT=t;const sv=SIMCLOCK.sun();const f=Math.min(1,Math.max(0,(sv.el+6)/14));const k=.04+.22*f;for(const m of mats)m.envMapIntensity=m.metalness>.3?k*2.5:k;if(hemi&&hemiI!=null)hemi.intensity=hemiI*.45;if(C.renderer)C.renderer.toneMappingExposure=.82+.1*(1-f)}
    if(water&&waterNorm){waterNorm.offset.x=(t*.004)%1;waterNorm.offset.y=(t*.0025)%1}
    // animated people: take over the simulated pedestrians nearest the camera
    const pb=WORLD.inst.pb&&WORLD.inst.pb.m,ph=WORLD.inst.ph&&WORLD.inst.ph.m;
    if(pb&&camD<160){const arr=pb.instanceMatrix.array,n=pb.count,cx=camera.position.x,cz=camera.position.z;const cand=[];for(let i=0;i<n;i++){const x=arr[i*16+12],z=arr[i*16+14],y=arr[i*16+13];if(arr[i*16]===0&&arr[i*16+1]===0&&arr[i*16+2]===0)continue;const d=(x-cx)**2+(z-cz)**2;if(d<120*120&&y>-100)cand.push([d,i])}
      cand.sort((a,b)=>a[0]-b[0]);const take=cand.slice(0,people.length);
      people.forEach((P,k)=>{const c=take[k];if(!c){P.o.visible=false;P.idx=-1;return}const i=c[1];m4.fromArray(arr,i*16);m4.decompose(p3,q4,s3);const yaw=new THREE.Euler().setFromQuaternion(q4,'YXZ').y;
        let moving=0;if(P.idx===i&&P.last){const dx=p3.x-P.last.x,dz=p3.z-P.last.z;moving=Math.hypot(dx,dz)/Math.max(dt,.016)}P.idx=i;P.last=p3.clone();
        P.o.visible=true;P.o.position.set(p3.x,p3.y,p3.z);P.o.rotation.set(0,yaw+Math.PI/2,0);const sp=Math.min(1,moving/.8),fast=moving>2.2?1:0;P.walk.setEffectiveWeight(sp*(1-fast));P.run.setEffectiveWeight(fast);P.idle.setEffectiveWeight(1-sp);P.walk.timeScale=.6+sp*.6;P.mx.update(dt);
        pb.setMatrixAt(i,ZERO);if(ph)ph.setMatrixAt(i,ZERO)});pb.instanceMatrix.needsUpdate=true;if(ph)ph.instanceMatrix.needsUpdate=true}else people.forEach(P=>{P.o.visible=false;P.idx=-1});
    // birds circle overhead by day; horses gallop round the arena at the nearest horse ranch
    const sv=SIMCLOCK.sun(),day=sv.el>2;birds.forEach((b,i)=>{b.o.visible=day&&camD<700;if(!b.o.visible)return;const a=t*b.sp+b.ph;const R=b.r+(i%3)*4;b.o.position.set(tg.x+Math.cos(a)*R,tg.y+b.h+Math.sin(a*2)*2,tg.z+Math.sin(a)*R);b.o.rotation.set(0,-a,0);b.mx.update(dt)});
    const farm=camD<500&&WORLD.W.farms.filter(f=>f.kind==='horse').map(f=>[f,Math.hypot(f.x-tg.x,f.z-tg.z)]).sort((a,b)=>a[1]-b[1])[0];
    horses.forEach((h,i)=>{if(!farm||farm[1]>300){h.o.visible=false;return}const f=farm[0];const cpos=new THREE.Vector3(14,0,-6).applyAxisAngle(up,f.rot||0);const a=t*.55+h.ph;const lx=Math.cos(a)*5.6,lz=Math.sin(a)*3.6;const v=new THREE.Vector3(lx,0,lz).applyAxisAngle(up,f.rot||0);
      h.o.visible=true;h.o.position.set(f.x+cpos.x+v.x,WORLD.Y+.05,f.z+cpos.z+v.z);h.o.rotation.set(0,-a+(f.rot||0),0);h.mx.update(dt)})};
})();
