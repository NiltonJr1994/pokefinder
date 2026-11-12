const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const plugin = require('../plugins/with-app-updater');
const manifest = { application:[{}] };
plugin.configure(manifest); plugin.configure(manifest);
assert.equal(manifest['uses-permission'].length,1);
assert.equal(manifest.application[0].provider.length,1);
assert.equal(manifest.application[0].provider[0].$['android:exported'],'false');
const main = 'PackageList(this).packages.apply { }';
assert.equal(plugin.register(plugin.register(main)),plugin.register(main));
assert.throws(() => plugin.register('unrecognized native template'));
assert.equal(fs.readFileSync(path.join(__dirname,'../native/AppUpdaterModule.kt'),'utf8'),
  fs.readFileSync(path.join(__dirname,'../android/app/src/main/java/com/njsoftwares/pokecodefinder/AppUpdaterModule.kt'),'utf8'));
let slots=[], cursor=0, mounted=false, effects=[], cleanup=[], intervals=[], listener;
let current={state:'idle', received:0,total:0,tag:''}, permitted=false, installs=0,cancels=0,starts=[];
let delayed;
const native = {
  start:async (...args)=>{starts.push(args);current={state:'downloading',received:1,total:10,tag:'4.6.0'};},
  getStatus:()=>delayed?delayed.promise:Promise.resolve({...current}),
  cancel:async ()=>{cancels++;current={state:'idle',received:0,total:0,tag:''};},
  canInstall:async()=>permitted,
  install:async()=>{installs++;return permitted?'installer':'permission';},
};
const appState={currentState:'active',addEventListener:(_name,fn)=>{listener=fn;return{remove:()=>{listener=undefined;}};}};
const react={
  useState(initial){const i=cursor++;if(!(i in slots))slots[i]=initial;return [slots[i],v=>{slots[i]=typeof v==='function'?v(slots[i]):v;}];},
  useRef(initial){const i=cursor++;if(!(i in slots))slots[i]={current:initial};return slots[i];},
  useCallback:fn=>fn,
  useEffect:fn=>{if(!mounted)effects.push(fn);},
};
const moduleResult={exports:{}};
new Function('require','module','exports','setInterval','clearInterval',ts.transpileModule(
  fs.readFileSync(path.join(__dirname,'../src/app-update.ts'),'utf8'),{
    compilerOptions:{module:ts.ModuleKind.CommonJS,esModuleInterop:true,target:ts.ScriptTarget.ES2022},
  }).outputText)(id=>id==='react'?react:{AppState:appState,NativeModules:{PokeFinderUpdater:native},Platform:{OS:'android'}},
  moduleResult,moduleResult.exports,fn=>{intervals.push(fn);return intervals.length-1;},id=>{intervals[id]=undefined;});
function render(){cursor=0;return moduleResult.exports.useAppDownload();}
const tick=()=>new Promise(resolve=>setImmediate(resolve));
(async()=>{
  let hook=render();for(const fn of effects)cleanup.push(fn());mounted=true;await tick();
  const asset={url:'https://github.com/NiltonJr1994/pokefinder/releases/download/v4.6.0/PokeFinder-4.6.0-Android-b46000.apk',tag:'4.6.0',revision:46000,digest:'a'.repeat(64),size:10};
  await hook.start(asset,'Update');hook=render();assert.equal(hook.download.state,'downloading');
  assert.deepEqual(starts[0],[asset.url,asset.tag,46000,asset.digest,10,'Update']);
  current={...current,state:'ready',received:10};intervals[0]();await tick();hook=render();assert.equal(hook.download.state,'ready');
  await hook.install();assert.equal(installs,1);hook=render();assert.equal(hook.permission,true);
  listener('active');await tick();assert.equal(installs,1,'denying permission must not reopen settings in a loop');
  await hook.install();assert.equal(installs,2);permitted=true;listener('active');await tick();await tick();
  assert.equal(installs,3,'an explicitly requested install resumes after permission is granted');
  current={...current,state:'updated'};intervals[0]();await tick();hook=render();assert.equal(hook.download.state,'updated');
  await hook.cancel();hook=render();assert.equal(hook.download.state,'idle');
  delayed=Promise.withResolvers();intervals[0]();await tick();
  await hook.cancel();delayed.resolve({state:'downloading',tag:'4.6.0',received:1,total:10});delayed=undefined;await tick();
  hook=render();assert.equal(hook.download.state,'idle','a stale progress query must not undo cancellation');
  current={...current,state:'error'};const before=cancels;await hook.start(asset,'Update');assert.equal(cancels,before+1,'retry clears failed downloads');
  for(const fn of cleanup)fn();assert.equal(listener,undefined);assert.ok(intervals.every(fn=>!fn));
  console.log('Atualizador validado: retomada, permissão, cancelamento, nova tentativa e configuração Android.');
})().catch(error=>{console.error(error);process.exitCode=1;});
