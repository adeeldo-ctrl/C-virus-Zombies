(() => {
  const canvas = document.getElementById("game");
  const engine = new BABYLON.Engine(canvas, true, {preserveDrawingBuffer:false, stencil:true, antialias:true});
  const state = {health:100, stamina:100, moveX:0, moveY:0, yaw:0, pitch:0, safe:false, sprint:false};
  const scene = new BABYLON.Scene(engine);
  scene.collisionsEnabled = true;
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
  const road=mat("road","#343b40"), pavement=mat("pavement","#777b78"), wallA=mat("wallA","#b6a58c"), wallB=mat("wallB","#87949a"), windowMat=mat("windows","#344c59"), heroMat=mat("hero","#183f65"), skin=mat("skin","#b98462"), zombieMat=mat("zombie","#667d58"), safeMat=mat("safe","#35c979"), pantsMat=mat("pants","#263443"), bootMat=mat("boots","#302a25"), hairMat=mat("hair","#17191b"), shirtMat=mat("shirt","#d2d0c7"), packMat=mat("pack","#8b6844");
  const ground=BABYLON.MeshBuilder.CreateGround("ground",{width:130,height:130},scene); ground.material=pavement; ground.checkCollisions=true;
  const street=BABYLON.MeshBuilder.CreateGround("street",{width:15,height:115},scene); street.position.y=.025; street.material=road;
  for(let i=-5;i<=5;i++){const line=BABYLON.MeshBuilder.CreateBox("lane",{width:.12,height:.025,depth:4},scene);line.position.set(0,.06,i*10);line.material=mat("lane"+i,"#d7cfa7");}
  function building(x,z,w,d,h,material){const b=BABYLON.MeshBuilder.CreateBox("building",{width:w,height:h,depth:d},scene);b.position.set(x,h/2,z);b.material=material;b.checkCollisions=true;for(let y=2;y<h-1;y+=3)for(let side=-1;side<=1;side+=2){const win=BABYLON.MeshBuilder.CreateBox("window",{width:1.1,height:1.25,depth:.08},scene);win.position.set(x+side*(w/2+.045),y,z-d/2-.02);win.material=windowMat;}}
  for(let z=-45;z<=45;z+=18){building(-13,z,10,12,9+(Math.abs(z)%3)*2,wallA);building(13,z,10,12,11,wallB);}
  // Collision boundaries keep the player inside the playable street block.
  for(const x of [-7.6,7.6]){const wall=BABYLON.MeshBuilder.CreateBox("streetBoundary",{width:.5,height:4,depth:120},scene);wall.position.set(x,2,0);wall.checkCollisions=true;wall.visibility=0.001;}
  for(const z of [-58,58]){const wall=BABYLON.MeshBuilder.CreateBox("streetEndBoundary",{width:15.5,height:4,depth:.5},scene);wall.position.set(0,2,z);wall.checkCollisions=true;wall.isVisible=false;}
  const player=BABYLON.MeshBuilder.CreateCapsule("playerCollider",{height:1.9,radius:.42},scene);player.material=heroMat;player.visibility=0.001;player.position.set(0,.95,35);player.checkCollisions=true;player.ellipsoid=new BABYLON.Vector3(.42,.95,.42);camera.lockedTarget=player;
  // Original modular hero blockout with articulated limbs and layered clothing.
  const heroParts=[];
  const part=(name,mesh,material,parent=player)=>{mesh.name=name;mesh.material=material;mesh.parent=parent;heroParts.push(mesh);return mesh;};
  const torso=part("hero-jacket",BABYLON.MeshBuilder.CreateBox("heroJacket",{width:.62,height:.82,depth:.34},scene),heroMat);torso.position.set(0,.13,0);
  const shirt=part("hero-shirt",BABYLON.MeshBuilder.CreateBox("heroShirt",{width:.3,height:.48,depth:.035},scene),shirtMat);shirt.position.set(0,.13,.183);
  const head=part("hero-head",BABYLON.MeshBuilder.CreateSphere("heroHead",{diameter:.43,segments:16},scene),skin);head.position.set(0,.78,0);
  const hair=part("hero-hair",BABYLON.MeshBuilder.CreateSphere("heroHair",{diameter:.44,segments:12},scene),hairMat);hair.position.set(0,.91,-.015);hair.scaling.y=.55;
  const pack=part("hero-backpack",BABYLON.MeshBuilder.CreateBox("heroPack",{width:.4,height:.52,depth:.19},scene),packMat);pack.position.set(0,.18,-.25);
  const limb=(name,x,y,material,length,radius)=>{const pivot=new BABYLON.TransformNode(name+"Pivot",scene);pivot.parent=player;pivot.position.set(x,y,0);const mesh=part(name,BABYLON.MeshBuilder.CreateCylinder(name+"Mesh",{height:length,diameter:radius*2,tessellation:10},scene),material,pivot);mesh.position.y=-length/2;return pivot;};
  const leftArm=limb("hero-left-arm",-.39,.42,heroMat,.67,.115),rightArm=limb("hero-right-arm",.39,.42,heroMat,.67,.115);
  const leftLeg=limb("hero-left-leg",-.17,-.3,pantsMat,.72,.14),rightLeg=limb("hero-right-leg",.17,-.3,pantsMat,.72,.14);
  const leftBoot=part("hero-left-boot",BABYLON.MeshBuilder.CreateBox("heroLeftBoot",{width:.22,height:.16,depth:.34},scene),bootMat);leftBoot.position.set(-.17,-.79,.07);
  const rightBoot=part("hero-right-boot",BABYLON.MeshBuilder.CreateBox("heroRightBoot",{width:.22,height:.16,depth:.34},scene),bootMat);rightBoot.position.set(.17,-.79,.07);
  const heroRig={leftArm,rightArm,leftLeg,rightLeg,heroParts};
  const safe=BABYLON.MeshBuilder.CreateCylinder("safeZone",{diameter:5,height:.12,tessellation:48},scene);safe.position.set(0,.12,-43);safe.material=safeMat;
  const zombies=[];
  for(let i=0;i<5;i++){const z= BABYLON.MeshBuilder.CreateCapsule("walker"+i,{height:1.85,radius:.43},scene);z.material=zombieMat;z.position.set((i%2?1:-1)*(4+i),1,-10-i*7);zombies.push(z);}
  let damageTimer=0, touchX=0, touchY=0, verticalVelocity=0, grounded=true, jumpCooldown=0;
  // Read-only debug surface used by the automated browser smoke test.
  window.__CVIRUS_DEBUG__={engine,scene,player,zombies,safe,state,heroRig};
  scene.onBeforeRenderObservable.add(()=>{
    const dt=Math.min(engine.getDeltaTime()/1000,.04);
    const moving=state.moveX*state.moveX+state.moveY*state.moveY>.025;
    const gait=moving?Math.sin(performance.now()*.012*(state.sprint?1.35:1)):0;
    heroRig.leftLeg.rotation.x=gait*.62;heroRig.rightLeg.rotation.x=-gait*.62;heroRig.leftArm.rotation.x=-gait*.48;heroRig.rightArm.rotation.x=gait*.48;
    const forward=new BABYLON.Vector3(Math.sin(state.yaw),0,-Math.cos(state.yaw));
    const right=new BABYLON.Vector3(-forward.z,0,forward.x);
    const move=forward.scale(-state.moveY).add(right.scale(state.moveX));
    if(move.lengthSquared()>1)move.normalize();
    jumpCooldown=Math.max(0,jumpCooldown-dt);
    if(move.lengthSquared()>0.001&&!state.safe&&state.health>0){move.normalize();player.rotation.y=Math.atan2(move.x,move.z);}
    if(!state.safe&&state.health>0){
      const wantsSprint=(state.sprint||keys.shift)&&move.lengthSquared()>.01&&state.stamina>1;
      if(wantsSprint)state.stamina=Math.max(0,state.stamina-27*dt);
      else state.stamina=Math.min(100,state.stamina+18*dt);
      const speed=wantsSprint?8.2:5.2;
      verticalVelocity-=19*dt;
      player.moveWithCollisions(new BABYLON.Vector3(move.x*speed*dt,verticalVelocity*dt,move.z*speed*dt));
      if(player.position.y<=.97&&verticalVelocity<=0){player.position.y=.95;verticalVelocity=0;grounded=true;}
      else if(player.position.y>.97){grounded=false;}
      const staminaBar=document.getElementById("stamina");
      if(staminaBar)staminaBar.style.width=state.stamina+"%";
    }
    let near=false;
    zombies.forEach(z=>{if(state.safe||state.health<=0)return;const delta=player.position.subtract(z.position);delta.y=0;const dist=delta.length();if(dist>1.25&&dist<28){delta.normalize();z.position.addInPlace(delta.scale(1.45*dt));z.rotation.y=Math.atan2(delta.x,delta.z);}if(dist<1.7)near=true;});
    if(near&&!state.safe&&state.health>0){damageTimer+=dt;if(damageTimer>.45){state.health=Math.max(0,state.health-3);damageTimer=0;document.getElementById("health").style.width=state.health+"%";}}
    const reached=BABYLON.Vector3.Distance(player.position,safe.position)<3;
    if(reached){state.safe=true;document.getElementById("message").textContent="Safe zone reached — prototype objective complete!";document.getElementById("status").textContent="You made it to safety.";}
    else if(state.health<=0){document.getElementById("message").textContent="Health depleted — refresh to retry";document.getElementById("status").textContent="You were caught. Refresh the page to retry.";}
  });
  // Keyboard controls
  const keys={};
  const doJump=()=>{if(grounded&&jumpCooldown===0&&!state.safe&&state.health>0){verticalVelocity=7.2;grounded=false;jumpCooldown=.22;}};
  window.addEventListener("keydown",e=>{const key=e.key.toLowerCase();if(["arrowup","arrowdown","arrowleft","arrowright"," "].includes(key))e.preventDefault();keys[key]=true;if(e.code==="Space")doJump();});
  window.addEventListener("keyup",e=>keys[e.key.toLowerCase()]=false);
  window.addEventListener("blur",()=>{for(const key in keys)keys[key]=false;state.sprint=false;});
  engine.runRenderLoop(()=>{const keyX=(keys.d||keys.arrowright?1:0)-(keys.a||keys.arrowleft?1:0);const keyY=(keys.s||keys.arrowdown?1:0)-(keys.w||keys.arrowup?1:0);state.moveX=touchX!==0?touchX:keyX;state.moveY=touchY!==0?touchY:keyY;scene.render();});
  // Touch joystick
  const stick=document.getElementById("stick"),knob=document.getElementById("knob");let active=false;
  const sprintButton=document.getElementById("sprint"),jumpButton=document.getElementById("jump");
  sprintButton.addEventListener("pointerdown",e=>{state.sprint=true;sprintButton.setPointerCapture(e.pointerId);});
  const stopSprint=()=>state.sprint=false;sprintButton.addEventListener("pointerup",stopSprint);sprintButton.addEventListener("pointercancel",stopSprint);sprintButton.addEventListener("lostpointercapture",stopSprint);
  const jump=doJump;
  jumpButton.addEventListener("pointerdown",jump);
  function joystick(e){const r=stick.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;let dx=e.clientX-cx,dy=e.clientY-cy;const max=36,len=Math.hypot(dx,dy)||1;if(len>max){dx=dx/len*max;dy=dy/len*max;}knob.style.transform="translate("+dx+"px,"+dy+"px)";touchX=dx/max;touchY=dy/max;}
  stick.addEventListener("pointerdown",e=>{active=true;stick.setPointerCapture(e.pointerId);joystick(e);});
  stick.addEventListener("pointermove",e=>{if(active)joystick(e);});
  const reset=()=>{active=false;knob.style.transform="";touchX=0;touchY=0;};
  stick.addEventListener("pointerup",reset);stick.addEventListener("pointercancel",reset);
  // Drag on right side to rotate the follow camera.
  let look=null;canvas.addEventListener("pointerdown",e=>{if(e.clientX>innerWidth*.42)look={x:e.clientX,y:e.clientY};});
  canvas.addEventListener("pointermove",e=>{if(!look)return;state.yaw-=(e.clientX-look.x)*.006;camera.rotationOffset=180+state.yaw*180/Math.PI;camera.heightOffset=BABYLON.Scalar.Clamp(camera.heightOffset+(e.clientY-look.y)*.018,2.2,5.5);look={x:e.clientX,y:e.clientY};});
  canvas.addEventListener("pointerup",()=>look=null);canvas.addEventListener("pointercancel",()=>look=null);
  canvas.addEventListener("wheel",e=>{camera.radius=BABYLON.Scalar.Clamp(camera.radius+Math.sign(e.deltaY)*.7,5,12);},{passive:true});
  document.addEventListener("visibilitychange",()=>{if(document.hidden){state.sprint=false;touchX=0;touchY=0;reset();}});
  window.addEventListener("resize",()=>engine.resize());
})();
