// ==============================================
// Copyright (c) 2025 reall3d.com, MIT license
// ==============================================
import './reall3d/style/style.less';
import 'virtual:svg-icons-register';

import { Reall3dViewer } from './reall3d/viewer/Reall3dViewer';
import { Reall3dViewerOptions } from './reall3d/viewer/Reall3dViewerOptions';
import { Reall3dMapViewer } from './reall3d/mapviewer/Reall3dMapViewer';
import { globalEv } from './reall3d/events/SetupGlobalEV';
import { PlaytBgAudio } from './reall3d/events/EventConstants';

import { getCarProperties } from './reall3d/cars/CarProperties';
import { loadHotspotsFromJSON } from './reall3d/cars/loadHotspots';
import { IsCameraChangedNeedUpdate } from './reall3d/events/EventConstants';

import { Vector3 } from 'three';
import { MarkSinglePoint } from './reall3d/meshs/mark/MarkSinglePoint';
import { SelectMarkPoint, GetScene } from './reall3d/events/EventConstants';

const params: URLSearchParams = new URLSearchParams(location.search);
let url = params.get('url');
const debugMode = !!params.get('debug');

const sceneID = "204RC1EG2KR751586_80118E1B6E3E"
const customScenePath = `/assets/${sceneID}/point_cloud_9999.spz`; // output_merged.ply;
const maxRenderCountOfPc = 512 * 10000;
const shDegree = 3;

// Read the .json file and extract car properties to: 
    // - Setup the look at direction to the car center. 
    // 
const carProperties = await getCarProperties(sceneID);

const hotspotsPath = `/assets/${sceneID}/hotspots.json`;

console.log('CarProperties', carProperties);
window.addEventListener('resize', () => {
    fetch('/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'Window resized',
        width: window.innerWidth,
        height: window.innerHeight,
      }),
    });
  });
  
let viewer: Reall3dViewer;
let mapViewer: Reall3dMapViewer;
if (url) {
    viewer = new Reall3dViewer({ debugMode });
    viewer.addModel(url);
    debugMode && initDevMode(true);
} else {
    viewer = new Reall3dViewer({
        debugMode: true,
        bigSceneMode:false,
        maxRenderCountOfPc: maxRenderCountOfPc,
        shDegree: shDegree,
        autoRotate: false,
        enableRotate: true,
        enableZoom: true,
        fov:70,//carProperties.fov,
        near: 0.010,
        far: 100.0,
        pointcloudMode:true,
        //minDistance:4.5,
        //minPolarAngle: Math.PI * 0.48,
        //maxPolarAngle: Math.PI * 0.42,
        lookUp: carProperties.look_up, // that's the Y-axis from the orthonormal matrix.
        lookAt:carProperties.car_center ,   // that's the computed car center. 
        position:carProperties.cam_location_init ,  // that the stabilized cam. position for the angle 180°
    });
    await viewer.addModel(customScenePath);

    initDevMode(true);
}
await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 0.5s

//const markers = await loadHotspotsFromJSON(viewer, sceneID);

//const carCenter = new Vector3().fromArray(carProperties.car_center);


// Check for camera changes every 100ms, but only update if camera actually changed
//setInterval(() => {
//    if (viewer.getEvents().fire(IsCameraChangedNeedUpdate)) {
  //      markers.forEach(marker => {
    //        marker.forceVisibilityUpdate(carCenter);
      //  });
    //}
//}, 100);

// 以下仅开发模式使用
function initDevMode(infoOnly = false) {
    document.querySelectorAll('.prd-mode').forEach(dom => dom['style'].removeProperty('display'));
    let spans: NodeListOf<HTMLSpanElement> = document.querySelectorAll('#gsviewer .operation span');
    let jsHeapSizeLimit = (performance['memory'] || { usedJSHeapSize: 0, totalJSHeapSize: 0, jsHeapSizeLimit: 0 }).jsHeapSizeLimit;
    !jsHeapSizeLimit && document.querySelectorAll('.tr-memory').forEach(dom => dom.classList.toggle('hidden'));
    navigator.userAgent.includes('Mobi') && document.querySelectorAll('.tr-pc-only').forEach(dom => dom.classList.toggle('hidden'));
    document.querySelectorAll('.dev-panel').forEach(dom => dom['style'].removeProperty('display'));
    !infoOnly &&
        Array.from(spans).forEach(span => {
            span.addEventListener('click', function (e: MouseEvent) {
                let target: HTMLSpanElement = e.target as HTMLSpanElement;
                fnClick(target.className);
            });
        });
    infoOnly && document.querySelectorAll('.operation').forEach(dom => (dom['style'].display = 'none'));

    const gstext: HTMLInputElement = document.querySelector('.gstext');
    if (gstext) {
        gstext.addEventListener('keyup', function (e: Event) {
            viewer && window['$api']?.setWaterMark(gstext.value, false);
        });
    }
}

function fnClick(className: string) {
    if (className == 'switch-debug') {
        let txt = document.querySelector('#gsviewer .debug').classList.toggle('hidden') ? '＋' : '－';
        document.querySelector('#gsviewer .switch-debug').innerHTML = txt;
    } else if (className == 'op-show') {
        let txt = document.querySelector('#gsviewer .operation table').classList.toggle('plus') ? '＋' : '－';
        document.querySelector('#gsviewer .op-show').innerHTML = txt;
    } else if (className == 'demo1') {
        viewer?.dispose();
        mapViewer?.dispose();
        viewer = viewer || new Reall3dViewer({ debugMode: true, maxRenderCountOfPc, shDegree });
        viewer.reset({ debugMode: true });
        setTimeout(() => viewer.addModel(`https://reall3d.com/demo-models/yz.spx`), 50); // Let it GC
    } else if (className == 'demo2') {
        viewer?.dispose();
        mapViewer?.dispose();
        viewer = viewer || new Reall3dViewer({ debugMode: true, maxRenderCountOfPc, shDegree });
        viewer.reset({ debugMode: true });
        setTimeout(() => viewer.addModel(`https://reall3d.com/demo-models/jtstjg.spx`), 50); // Let it GC
    } else if (className == 'demo3') {
        viewer?.dispose();
        mapViewer?.dispose();
        viewer = viewer || new Reall3dViewer({ debugMode: true, maxRenderCountOfPc, shDegree });
        viewer.reset({ debugMode: true });
        setTimeout(() => viewer.addModel(`https://reall3d.com/demo-models/djj.spx`), 50); // Let it GC
        globalEv.fire(PlaytBgAudio);
    } else if (className == 'demo4') {
        viewer?.dispose();
        mapViewer?.dispose();
        viewer = viewer || new Reall3dViewer({ debugMode: true, maxRenderCountOfPc, shDegree });
        viewer.reset({ debugMode: true });
        setTimeout(() => viewer.addModel(`https://reall3d.com/demo-models/bzg.spx`), 50); // Let it GC
    } else if (className == 'ppt') {
        viewer?.dispose();
        mapViewer?.dispose();
        viewer = viewer || new Reall3dViewer({ debugMode: true, maxRenderCountOfPc, shDegree });
        viewer.reset({ debugMode: true });
        setTimeout(() => viewer.addModel(`https://reall3d.com/demo-models/ppt.spx`), 50); // Let it GC
    } else if (className == 'switch-rotate') {
        let opts: Reall3dViewerOptions = viewer?.options();
        viewer?.options({ autoRotate: !opts.autoRotate });
    } else if (className == 'switch-pointcloudMode') {
        viewer?.options({ pointcloudMode: !viewer?.options().pointcloudMode });
    } else if (className == 'switch-deiplay-mode') {
        viewer?.switchDeiplayMode();
    } else if (className == 'add-lightFactor') {
        viewer?.options({ lightFactor: viewer?.options().lightFactor + 0.1 });
    } else if (className == 'default-lightFactor') {
        viewer?.options({ lightFactor: 1 });
    } else if (className == 'sub-lightFactor') {
        let opts: Reall3dViewerOptions = viewer?.options();
        viewer?.options({ lightFactor: opts.lightFactor - 0.1 });
    } else if (className == 'show-watermark') {
        viewer?.fire(1, 1);
    } else if (className == 'hide-watermark') {
        viewer?.fire(1, 0);
    } else if (className == 'mark-show') {
        viewer?.options({ markVisible: true });
    } else if (className == 'mark-hide') {
        viewer?.options({ markVisible: false });
    } else if (className == 'mark-save') {
        viewer?.fire(6);
    } else if (className == 'mark-del') {
        viewer?.fire(7);
    } else if (className == 'mark-point') {
        viewer?.options({ markMode: true, markType: 'point' });
    } else if (className == 'mark-lines') {
        viewer?.options({ markMode: true, markType: 'lines' });
    } else if (className == 'mark-plans') {
        viewer?.options({ markMode: true, markType: 'plans' });
    } else if (className == 'mark-distance') {
        viewer?.options({ markMode: true, markType: 'distance' });
    } else if (className == 'mark-circle') {
        viewer?.options({ markMode: true, markType: 'circle' });
    } else if (className == 'add-pos') {
        viewer?.fire(2);
        mapViewer?.fire(2);
    } else if (className == 'fly') {
        viewer?.fire(3);
        mapViewer?.fire(3);
    } else if (className == 'clear-pos') {
        viewer?.fire(4);
        mapViewer?.fire(4);
    } else if (className == 'fly-save') {
        viewer?.fire(5);
        mapViewer?.fire(5);
    } else if (className == 'add-sh') {
        viewer?.fire(8, 1);
    } else if (className == 'default-sh') {
        viewer?.fire(8);
    } else if (className == 'sub-sh') {
        viewer?.fire(8, -1);
    } else if (className == 'add-quality') {
        viewer?.fire(9, 1);
    } else if (className == 'default-quality') {
        viewer?.fire(9);
    } else if (className == 'sub-quality') {
        viewer?.fire(9, -1);
    } else if (className == 'map') {
        viewer?.dispose();
        mapViewer?.dispose();
        viewer = null;
        document.querySelector('.debug.dev-panel')?.classList?.add('map');
        document.querySelector('#map')?.classList?.remove('hidden');
        mapViewer = new Reall3dMapViewer({ debugMode: true });
        mapViewer.addScenes('https://reall3d.com/demo-models/map/00.scenes.json');
    }
}
