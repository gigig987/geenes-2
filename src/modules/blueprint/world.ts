export interface WorldProperties {
    scale: number,
    pointX: number,
    pointY: number
}
declare global {
    interface Window {
        mozRequestAnimationFrame:any;
    }
}

interface Coordinates {
    x: number,
    y: number
}

import {_requestAnimationFrame, flipString} from '@/utilities/utilities';
import {generateRulerValues} from './rulers';

let onResizeWindowRef : any
let rulerW: HTMLDivElement
let rulerH: HTMLDivElement

class World {
    properties : WorldProperties
    body: HTMLElement
    container: HTMLElement
    wrapper: HTMLDivElement
    updating : boolean
    private viewportW :number
    private viewportH :number
    private areRulersActive: boolean =  false
    private rulerIncrement : number = 100

    constructor(body? : HTMLElement, properties? : WorldProperties) {
        this.body = body || document.body;
        this.wrapper = document.createElement("div");
        this.container = document.createElement("div");
        this.container.appendChild(this.wrapper);
        this.container.setAttribute('id', 'world-container');
        this.wrapper.setAttribute('id', 'world-wrapper');
        this.body.appendChild(this.container);

        this.properties = properties || {scale:1, pointX:0, pointY:0}
        this.updating = false
        // https://stackoverflow.com/questions/59719464/this-is-undefined-in-class-method-with-requestanimationframe
        // \/
        this.updateTransform = this.updateTransform.bind(this);

        this.viewportW =  this.body.offsetWidth;
        this.viewportH =  this.body!.offsetHeight;
    }
    
    getProperties(): WorldProperties {
        return this.properties || {scale:1, pointX:0, pointY:0}
    }
    
    showRulers() : void {
        this.areRulersActive = true;
        rulerW = document.createElement('div');
        rulerW.classList.add('ruler', 'horizontal');
        this.body.appendChild(rulerW);
        rulerH = document.createElement('div');
        rulerH.classList.add('ruler', 'vertical');
        this.body.appendChild(rulerH);
        this.calculateRuler();
        const rulerOrigin = document.createElement('div');
        rulerOrigin.classList.add('ruler', 'origin');
        this.body.appendChild(rulerOrigin);
        window.addEventListener('resize', onResizeWindowRef = this.onResizeWindow.bind(this));
    }

    removeRulers() : void {
        this.areRulersActive = false
        rulerW.remove()
        window.removeEventListener('resize', onResizeWindowRef)
    }
    private onResizeWindow() {
        this.viewportW =  this.body.offsetWidth;
        this.viewportH =  this.body!.offsetHeight;
        //TODO evaluate further optimisation to recaulculate only whe the threashold is reached
        // e.g this.viewportW < abs(values[0] - values[last])
        this.calculateRuler();
    }
    private calculateRuler() {
        let {pointX, pointY, scale} = this.properties

        if (scale < 0.15) {
            this.rulerIncrement = 1000
        } else if (scale >= 0.15 && scale < 0.3) {
            this.rulerIncrement = 500
        } else if (scale >= 0.2 && scale < 0.5) {
            this.rulerIncrement = 250
        } else if (scale >= 0.5 && scale < 1.5) {
            this.rulerIncrement = 100
        } else if (scale >= 1.5 && scale < 5) {
            this.rulerIncrement = 50
        } else if (scale >= 5 && scale < 10) {
            this.rulerIncrement = 20
        } else if (scale >= 10 && scale < 30) {
            this.rulerIncrement = 10
        } else if (scale >= 30 && scale < 50) {
            this.rulerIncrement = 5
        } else if (scale >= 50 ) {
            this.rulerIncrement = 1
        } 
        const stepsW = Math.ceil(this.viewportW  / scale / this.rulerIncrement)
        const stepsH = Math.ceil(this.viewportH  / scale / this.rulerIncrement)
        rulerW.style.setProperty('--stepsW', stepsW.toString())
        rulerW.style.setProperty('--increment', `${this.rulerIncrement * scale}px`)
        rulerH.style.setProperty('--increment', `${this.rulerIncrement * scale}px`)

        const {values: valuesW, spacing: spacingW, indent: indentW} = generateRulerValues(stepsW, this.rulerIncrement, pointX, scale)
        rulerW.style.setProperty('--spacing', `${spacingW}ch`)
        rulerW.style.setProperty('--indent', `${indentW}ch`)
        rulerW.style.setProperty('--values-x', `"${valuesW.join(' ')}"`)
        rulerW.style.setProperty('--point-x', `${pointX}px`)
        rulerW.style.setProperty(
            '--delta-point-x',
            `${((pointX / scale)  + parseInt(valuesW[0])) * scale}px`
        )
        const {values: valuesH, spacing: spacingH, indent: indentH} = generateRulerValues(stepsH, this.rulerIncrement, pointY, scale)
        rulerH.style.setProperty('--spacing', `${spacingH}ch`)
        rulerH.style.setProperty('--indent', `${indentH}ch`)
        rulerH.style.setProperty('--values-y', `"${valuesH.map(value => flipString(value)).join(' ')}"`)
        rulerH.style.setProperty('--point-y', `${pointY}px`)
        rulerH.style.setProperty(
            '--delta-point-y',
            `${((pointY / scale)  + parseInt(valuesH[0])) * scale}px`
        )


    }
    private updateProperties(newProperties : WorldProperties) : void {
        this.properties = {...this.properties, ...newProperties}
        this.updating = true
        _requestAnimationFrame(this.updateTransform)
    }

    private updateTransform(): void {
        let {scale, pointX, pointY} = this.properties
        pointX = pointX ? pointX : 0
        this.wrapper.style.setProperty('--scale', scale ? scale.toString() : '1')
        this.wrapper.style.setProperty('--point-x', `${pointX}px`)
        this.wrapper.style.setProperty('--point-y', `${pointY}px`)
        this.container.style.transform = `translate3d(${pointX}px, ${pointY}px, 0) scale3d(${scale}, ${scale}, 1)`;
        this.wrapper.style.boxShadow = `0 0 ${10 / (scale ? scale : 1) }px rgb(0 0 0 / 20%)`

        // rules
        if (this.areRulersActive) {

            // rulerW.style.setProperty('--point-x', `${pointX}px`)
            
            // rulerW.style.setProperty(
            //     '--delta-point-x',
            //     `${((pointX / scale)  + this.rulerWValues[0]) * scale}px`
            // )
            // if ((-pointX / scale) <= (this.rulerWValues[0] - this.rulerIncrement) * scale) {
            //     // less than lowest ruler value
            //     this.calculateRuler()
            // console.log((-pointX + this.viewportW) / scale)
            // } else if(-pointX  / scale + this.viewportW >= (this.rulerWValues[this.rulerWValues.length -1]) * scale) {
            //     // more than highest ruler value
            //     this.calculateRuler()
            // }
            //TODO optimise calculation for when it is really necessary
            this.calculateRuler()

        }
        this.updating = false
    }

    move (coord: Coordinates) {
        const {pointX, pointY, scale} = this.getProperties()
        const {x, y} = coord || {x: pointX, y: pointY}
        this.updateProperties({pointX: x, pointY: y, scale: scale})
    }
    zoom (factor: number) {
        const {pointX, pointY, scale} = this.getProperties()
        factor = factor || scale
        this.updateProperties({pointX, pointY, scale: factor})
    }
    moveAndZoom (coord: Coordinates, factor: number) {
        const {pointX, pointY, scale} = this.getProperties()
        const {x, y} = coord || {x: pointX, y: pointY}
        factor = factor || scale
        this.updateProperties({pointX: x, pointY: y, scale: factor})
    }
    getProjectedPoint (coord : Coordinates) : Coordinates {
        const {pointX, pointY, scale} = this.getProperties()
        const {x, y} = coord
        const projectedCoord = {x: pointX / scale - x / scale, y: pointY / scale - y / scale}
        return projectedCoord
    }
}

export default World
