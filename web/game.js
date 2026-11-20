(() => {
  const canvas = document.getElementById("game");
  const engine = new BABYLON.Engine(canvas, true, {preserveDrawingBuffer:false, stencil:true, antialias:true});
  const state = {health:100, moveX:0, moveY:0, yaw:0, pitch:0, safe:false};
  const scene = new BABYLON.Scene(engine);
  scene.clearColor = new BABYLON.Color4(0.48,0.66,0.77,1);
  scene.fogMode = BABYLON.Scene.FOGMODE_EXP2;
  scene.fogDensity = 0.006;
  scene.fogColor = new BABYLON.Color3(0.48,0.66,0.77);
  const camera = new BABYLON.FollowCamera("follow", new BABYLON.Vector3(0,5,10), scene);
  camera.radius = 8; camera.heightOffset = 3.1; camera.rotationOffset = 180; camera.cameraAcceleration = 0.08; camera.maxCameraSpeed = 8;
  camera.attachControl(canvas, true);
  const light = new BABYLON.HemisphericLight("sky", new BABYLON.Vector3(0,1,0), scene); light.intensity = 0.9;
  const sun = new BABYLON.DirectionalLight("sun", new BABYLON.Vector3(-0.4,-1,0.3), scene); sun.position = new BABYLON.Vector3(20,35,-20); sun.intensity = 0.75;
  const mat = (name,color) => {const m=new BABYLON.StandardMaterial(name,scene);m.diffuseColor=BABYLON.Color3.FromHexString(color);return m;};
  const road=mat("road","#343b40"), pavement=mat("pavement","#777b78"), wallA=mat("wallA","#b6a58c"), wallB=mat("wallB","#87949a"), windowMat=mat("windows","#344c59"), heroMat=mat("hero","#2879a8"), skin=mat("skin","#b98462"), zombieMat=mat("zombie","#667d58"), safeMat=mat("safe","#35c979");
  const ground=BABYLON.MeshBuilder.CreateGround("ground",{width:130,height:130},scene); ground.material=pavement;
  const street=BABYLON.MeshBuilder.CreateGround("street",{width:15,height:115},scene); street.position.y=.025; street.material=road;
  for(let i=-5;i<=5;i++){const line=BABYLON.MeshBuilder.CreateBox("lane",{width:.12,height:.025,depth:4},scene);line.position.set(0,.06,i*10);line.material=mat("lane"+i,"#d7cfa7");}
  function building(x,z,w,d,h,material){const b=BABYLON.MeshBuilder.CreateBox("building",{width:w,height:h,depth:d},scene);b.position.set(x,h/2,z);b.material=material;for(let y=2;y<h-1;y+=3)for(let side=-1;side<=1;side+=2){const win=BABYLON.MeshBuilder.CreateBox("window",{width:1.1,height:1.25,depth:.08},scene);win.position.set(x+side*(w/2+.045),y,z-d/2-.02);win.material=windowMat;}}
  for(let z=-45;z<=45;z+=18){building(-13,z,10,12,9+(Math.abs(z)%3)*2,wallA);building(13,z,10,12,11,wallB);}
  const player=BABYLON.MeshBuilder.CreateCapsule("player",{height:1.9,radius:.42},scene);player.material=heroMat;player.position.set(0,1,35);camera.lockedTarget=player;
  const head=BABYLON.MeshBuilder.CreateSphere("heroHead",{diameter:.48},scene);head.position.y=1.05;head.parent=player;head.material=skin;
  const safe=BABYLON.MeshBuilder.CreateCylinder("safeZone",{diameter:5,height:.12,tessellation:48},scene);safe.position.set(0,.12,-43);safe.material=safeMat;
  const zombies=[];
  for(let i=0;i<5;i++){const z= BABYLON.MeshBuilder.CreateCapsule("walker"+i,{height:1.85,radius:.43},scene);z.material=zombieMat;z.position.set((i%2?1:-1)*(4+i),1,-10-i*7);zombies.push(z);}
  let last=performance.now(), damageTimer=0;
  scene.onBeforeRenderObservable.add(()=>{
    const dt=Math.min(engine.getDeltaTime()/1000,.04);
    const forward=new BABYLON.Vector3(Math.sin(state.yaw),0,Math.cos(state.yaw));
    const right=new BABYLON.Vector3(forward.z,0,-forward.x);
    const move=forward.scale(-state.moveY).add(right.scale(state.moveX));
    if(move.lengthSquared()>0.001){move.normalize();player.position.addInPlace(move.scale(5.0*dt));player.rotation.y=Math.atan2(move.x,move.z);}
    player.position.x=BABYLON.Scalar.Clamp(player.position.x,-7,7);player.position.z=BABYLON.Scalar.Clamp(player.position.z,-54,54);
    let near=false;
    zombies.forEach(z=>{const delta=player.position.subtract(z.position);delta.y=0;const dist=delta.length();if(dist>1.25&&dist<28){delta.normalize();z.position.addInPlace(delta.scale(1.45*dt));z.rotation.y=Math.atan2(delta.x,delta.z);}if(dist<1.7)near=true;});
    if(near&&!state.safe){damageTimer+=dt;if(damageTimer>.45){state.health=Math.max(0,state.health-3);damageTimer=0;document.getElementById("health").style.width=state.health+"%";}}
    const reached=BABYLON.Vector3.Distance(player.position,safe.position)<3;
    if(reached){state.safe=true;document.getElementById("message").textContent="Safe zone reached — prototype objective complete!";document.getElementById("status").textContent="You made it to safety.";}
    else if(state.health<=0){document.getElementById("message").textContent="Energy depleted — refresh to retry";document.getElementById("status").textContent="Try avoiding the walkers and keep moving.";}
  });
  // Keyboard controls
  const keys={};window.addEventListener("keydown",e=>keys[e.key.toLowerCase()]=true);window.addEventListener("keyup",e=>keys[e.key.toLowerCase()]=false);
  engine.runRenderLoop(()=>{state.moveX=(keys.d||keys.arrowright?1:0)-(keys.a||keys.arrowleft?1:0);state.moveY=(keys.s||keys.arrowdown?1:0)-(keys.w||keys.arrowup?1:0);scene.render();});
  // Touch joystick
  const stick=document.getElementById("stick"),knob=document.getElementById("knob");let active=false;
  function joystick(e){const r=stick.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;let dx=e.clientX-cx,dy=e.clientY-cy;const max=36,len=Math.hypot(dx,dy)||1;if(len>max){dx=dx/len*max;dy=dy/len*max;}knob.style.transform="translate("+dx+"px,"+dy+"px)";state.moveX=dx/max;state.moveY=dy/max;}
  stick.addEventListener("pointerdown",e=>{active=true;stick.setPointerCapture(e.pointerId);joystick(e);});
  stick.addEventListener("pointermove",e=>{if(active)joystick(e);});
  const reset=()=>{active=false;knob.style.transform="";state.moveX=0;state.moveY=0;};
  stick.addEventListener("pointerup",reset);stick.addEventListener("pointercancel",reset);
  // Drag on right side to rotate the follow camera.
  let look=null;canvas.addEventListener("pointerdown",e=>{if(e.clientX>innerWidth*.42)look={x:e.clientX,y:e.clientY};});
  canvas.addEventListener("pointermove",e=>{if(!look)return;state.yaw-=(e.clientX-look.x)*.006;camera.rotationOffset=180+state.yaw*180/Math.PI;look={x:e.clientX,y:e.clientY};});
  canvas.addEventListener("pointerup",()=>look=null);canvas.addEventListener("pointercancel",()=>look=null);
  window.addEventListener("resize",()=>engine.resize());
})();
