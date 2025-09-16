// ==============================================
// Copyright (c) 2025 reall3d.com, MIT license
// ==============================================

import { Vector3, Scene } from 'three';
import { MarkSinglePoint } from '../meshs/mark/MarkSinglePoint';
import { SelectMarkPoint, GetScene, GetCanvas, GetCanvasSize } from '../events/EventConstants';
import { Reall3dViewer } from '../viewer/Reall3dViewer';
import {IsCameraChangedNeedUpdate} from '../events/EventConstants';
interface HotspotsJSON {
    [hotspotId: string]: {
        [imageName: string]: [number, number]; // 2D coordinates
    };
}

/**
 * Loads 2D hotspots from a JSON file, converts them to 3D points using the SelectMarkPoint event,
 * and places MarkSinglePoint objects into the scene.
 *
 * @param viewer - The Reall3dViewer instance.
 * @param sceneID - The unique identifier for the scene (used to construct the hotspots file path).
 * @param originalResolution - The resolution the 2D coordinates were defined in (defaults to 3840x2160).
 * @returns Promise<MarkSinglePoint[]> - Array of created markers
 */
export async function loadHotspotsFromJSON(
    viewer: Reall3dViewer,
    sceneID: string,
    originalResolution = { width: 3840, height: 2160 }
): Promise<MarkSinglePoint[]> {
    const markers: MarkSinglePoint[] = [];
    
    try {
        const hotspotsPath = `/assets/${sceneID}/hotspots.json`;

        console.log(`[loadHotspotsFromJSON] Loading hotspots from: ${hotspotsPath}`);

        const response = await fetch(hotspotsPath);
        if (!response.ok) {
            throw new Error(`Failed to fetch hotspots: HTTP ${response.status} - ${response.statusText}`);
        }

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            fetch('/log', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    event: 'Hotspots JSON Parsing Error',
                    error: 'Invalid content type',
                    received: contentType
                })
            });
            throw new Error(`Invalid content type: expected application/json but got ${contentType}`);
        }

        let hotspots: HotspotsJSON;
        try {
            hotspots = await response.json();
            fetch('/log', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    event: 'Hotspots JSON Parsing',
                    status: 'success',
                    hotspotsCount: Object.keys(hotspots).length
                })
            });
        } catch (error) {
            fetch('/log', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    event: 'Hotspots JSON Parsing',
                    status: 'error',
                    error: error.message
                })
            });
            throw new Error(`Failed to parse hotspots JSON: ${error.message}`);
        }
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        const viewerElement = document.getElementById('gsviewer');
        const { width, height, top, left } = viewerElement.getBoundingClientRect();

        const scaleX = windowWidth / originalResolution.width;
        const scaleY = windowHeight / (originalResolution.height);  

        const scene = viewer.events.fire(GetScene) as Scene;

        if (!scene || typeof scene.add !== 'function') {
            throw new Error('Invalid scene returned by GetScene');
        }
        
        for (const [hotspotId, imageMap] of Object.entries(hotspots)) {
            const {name,
                    on_view,
                    camera_position,
                    xy_location2D,
                    rgb_location2D,
                    location3D,
                    XYZ_location3D
                } = imageMap as any;
                
                const [x, y,z] = XYZ_location3D;
                const point = new Vector3(x,y+0.1,z);
                const camPosHotspot = new Vector3(...camera_position);
                // const point = await viewer.events.fire(SelectMarkPoint, clientX, clientY) as Vector3;
                 
                fetch('/log', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        event: 'Hotspot 3D Point',
                        status: 'success',
                        hotspotId,
                        hotspotName: name,
                        imageName:on_view,
                       
                        hotspot3dpoint: point,
                    })
                });
                if (!point) {
                    continue;
                }
                const marker = new MarkSinglePoint(viewer.events, point, hotspotId, name, camPosHotspot);
                
                scene.add(marker);
                marker.drawFinish();
                
                // Add marker to the array
                markers.push(marker);
            
        }
        
        return markers;
    } catch (error) {
        console.error('[ERROR] Failed to load hotspots:', error);
        throw error; // Re-throw to allow caller to handle the error
    }
}
