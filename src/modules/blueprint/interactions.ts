declare global {
    interface Window {
        mozRequestAnimationFrame: any;
    }
    interface Coordinates {
        x: number,
        y: number
    }
}


import { _requestAnimationFrame } from '@/utilities/utilities';
// import {WorldProperties} from './world';

type BadgeTypes = 'resize' | 'move' | 'rotate'
export interface newTargetElementRectangle {
    x?: number,
    y?: number,
    width?: number,
    height?: number
}
export interface Rectangle {
    x: number,
    y: number,
    width: number,
    height: number
}
// RESIZING FEATURE
let targetElement: HTMLElement
let prevMousePosition: Coordinates = {
    x: 0,
    y: 0
}
let resizerHolder: HTMLElement | null
let resizeBadge: HTMLSpanElement | null
let resizingDirection: DOMTokenList
let resizingMethod: Function = (coord: Coordinates) => { }
let running: boolean = false
let rotateCenter: Coordinates
let angle: number = 0
let startAngle: number = 0
let cosFraction: number = 0
let sinFraction: number = 0
const minWidth: number = 1
const minHeight: number = 1

let initW: number = 0
let initX: number = 0
let initH: number = 0
let initY: number = 0
let mousePress: Coordinates

const R2D = 180 / Math.PI
const D2R = Math.PI / 180

export const useInteractions = () => {

    let moving: boolean = false
    let resizing: boolean = false
    let rotating: boolean = false

    const initResize: Function = (e: MouseEvent): void => {
        const resizer = e.target as HTMLElement
        resizing = true
        resizingDirection = resizer.classList

        if (!resizingDirection) return

        if (resizingDirection.contains('full')) {
            // resize only in vertical or horizontal directions
            if (resizingDirection.contains('right')) {
                resizingMethod = resizeElementHorizontalRight
            } else if (resizingDirection.contains('left')) {
                resizingMethod = resizeElementHorizontalLeft
            } else if (resizingDirection.contains('top')) {
                resizingMethod = resizeElementVerticalTop
            } else if (resizingDirection.contains('bottom')) {
                resizingMethod = resizeElementVerticalBottom
            }

        } else if (resizingDirection.contains('corner')) {
            // resize in both vertical or horizontal directions
            if (resizingDirection.contains('top-left')) {
                resizingMethod = resizeElementBothTopLeft
            } else if (resizingDirection.contains('top-right')) {
                resizingMethod = resizeElementBothTopRight
            } else if (resizingDirection.contains('bottom-left')) {
                resizingMethod = resizeElementBothBottomLeft
            } else if (resizingDirection.contains('bottom-right')) {
                resizingMethod = resizeElementBothBottomRight
            }
        }

        let r = getCurrentRotation()
        let initRadians = r * D2R
        cosFraction = Math.cos(initRadians)
        sinFraction = Math.sin(initRadians)

        initW = parseFloat(targetElement.style.width)
        initX = parseFloat(targetElement.style.left)
        initH = parseFloat(targetElement.style.height)
        initY = parseFloat(targetElement.style.top)

        mousePress = prevMousePosition
        createSizeBadge()
    }
    const endResize: Function = (): void => {
        resizing = false
        if (resizeBadge) {
            resizeBadge.remove()
            resizeBadge = null
        }
    }
    const resize: Function = (actualCoord: Coordinates, scaledCoord: Coordinates): void => {
        if (!resizeBadge || !resizerHolder) { return }
        running = true
        _requestAnimationFrame(() => {
            resizingMethod(scaledCoord)
            updateSizeBadge(actualCoord)
        })
    }

    const initMoving: Function = (e: MouseEvent): void => {

        console.log('moving', e)
        const target = e.target as HTMLElement
        moving = true
        if (target.tagName === 'MAIN' || target.tagName === 'LABEL') {
            targetElement = target.parentElement ? target.parentElement : target
        } else {
            targetElement = target
        }
        createSizeBadge()

    }
    const endMove: Function = (): void => {
        moving = false
        if (resizeBadge) {
            resizeBadge.remove()
            resizeBadge = null
        }
    }
    const move: Function = (actualCoord: Coordinates, scaledCoord: Coordinates): void => {
        if (!resizeBadge || !targetElement) { return }
        running = true
        _requestAnimationFrame(() => {
            moveElement(scaledCoord)
            updateSizeBadge(actualCoord, 'move')
        })
    }
    const initRotate: Function = (coord: Coordinates): void => {
        if (!targetElement) return
        const arrowRects = targetElement.getBoundingClientRect()

        rotateCenter = {
            x: arrowRects.left + arrowRects.width / 2,
            y: arrowRects.top + arrowRects.height / 2
        }
        let r = getCurrentRotation()
        let initRadians = r * D2R

        startAngle = Math.atan2(coord.y - rotateCenter.y, coord.x - rotateCenter.x) + Math.PI / 2 - initRadians
        rotating = true
        createSizeBadge()

    }
    const endRotate: Function = (): void => {
        rotating = false
        angle = 0
        if (resizeBadge) {
            resizeBadge.remove()
            resizeBadge = null
        }
    }
    const rotate: Function = (actualCoord: Coordinates, clientCoord: Coordinates): void => {
        if (!resizeBadge || !targetElement) { return }
        running = true
        _requestAnimationFrame(() => {
            rotateElement(clientCoord)
            updateSizeBadge(actualCoord, 'rotate')
        })
    }
    return {
        isRunning: function (): boolean {
            return running
        },
        setRunning: function (state: boolean): void {
            running = state
        },
        setPrevMousePosition: function (position: Coordinates): void {
            prevMousePosition = position
        },
        getTarget: function (): HTMLElement {
            return targetElement
        },
        setTarget: function (el: HTMLElement): void {
            targetElement = el
        },
        getResizeHolder: function (): HTMLElement | null {
            return resizerHolder
        },
        setResizeHolder: function (el: HTMLElement): void {
            resizerHolder = el
        },
        clean: function (): void {
            if (resizerHolder) {
                resizerHolder.remove()
                resizerHolder = null
            }
            if (resizeBadge) {
                resizeBadge.remove()
                resizeBadge = null
            }
        },
        initResize,
        isResizing: function (): boolean {
            return resizing
        },
        resize,
        endResize,
        initMoving,
        move,
        isMoving: function (): boolean {
            return moving
        },
        endMove,
        initRotate,
        rotate,
        isRotating: function (): boolean {
            return rotating
        },
        endRotate,
        normalizeDegrees
    }
}



const resizeElementHorizontalRight = (coord: Coordinates) => {
    if (!targetElement || !resizerHolder) {
        running = false
        return
    }
    resizeHandler(coord, false, false, true, false)
    running = false
}
const resizeElementHorizontalLeft = (coord: Coordinates) => {
    if (!targetElement || !resizerHolder) {
        running = false
        return
    }
    resizeHandler(coord, true, false, true, false)

    running = false
}
const resizeElementVerticalBottom = (coord: Coordinates) => {
    if (!targetElement || !resizerHolder) {
        running = false
        return
    }
    resizeHandler(coord, false, false, false, true)

    running = false
}
const resizeElementVerticalTop = (coord: Coordinates) => {
    if (!targetElement || !resizerHolder) {
        running = false
        return
    }
    resizeHandler(coord, false, true, false, true)

    running = false
}
const resizeElementBothTopLeft = (coord: Coordinates) => {
    if (!targetElement || !resizerHolder) {
        running = false
        return
    }
    resizeHandler(coord, true, true, true, true)

    running = false
}
const resizeElementBothTopRight = (coord: Coordinates) => {
    if (!targetElement || !resizerHolder) {
        running = false
        return
    }
    resizeHandler(coord, false, true, true, true)

    running = false
}
const resizeElementBothBottomLeft = (coord: Coordinates) => {
    if (!targetElement || !resizerHolder) {
        running = false
        return
    }
    // const w = `${Math.round(parseFloat(targetElement.style.width) + (prevMousePosition.x - coord.x))}px`
    // const l = `${Math.round(parseFloat(targetElement.style.left) - (prevMousePosition.x - coord.x))}px`
    // const h = `${Math.round(parseFloat(targetElement.style.height) - (prevMousePosition.y - coord.y))}px`
    // targetElement.style.width = w
    // targetElement.style.left = l
    // targetElement.style.height = h
    // resizerHolder.style.width = w
    // resizerHolder.style.left = l
    // resizerHolder.style.height = h
    // prevMousePosition = coord
    resizeHandler(coord, true, false, true, true)

    running = false
}
const resizeElementBothBottomRight = (coord: Coordinates) => {
    if (!targetElement || !resizerHolder) {
        running = false
        return
    }
    resizeHandler(coord, false, false, true, true)
    running = false
}

const moveElement = (coord: Coordinates) => {
    const l = `${Math.round(targetElement.offsetLeft - (prevMousePosition.x - coord.x))}px`
    const t = `${Math.round(targetElement.offsetTop - (prevMousePosition.y - coord.y))}px`
    targetElement.style.left = l
    targetElement.style.top = t
    if (resizerHolder) {
        resizerHolder.style.left = l
        resizerHolder.style.top = t
    }
    prevMousePosition = coord
    running = false
}
const rotateElement = (coord: Coordinates) => {
    // subtract starting angle
    angle = Math.atan2(coord.y - rotateCenter.y, coord.x - rotateCenter.x) + Math.PI / 2
    angle -= startAngle
    targetElement.style.setProperty('--angle', `${normalizeDegrees(angle * R2D)}deg`)

    if (resizerHolder) {
        resizerHolder.style.setProperty('--angle', `${normalizeDegrees(angle * R2D)}deg`)
    }
    autoOrientTagetElement()
    running = false
}
const autoOrientTagetElement = (): void => {
    // check how many times the current angle is divisible by 45 degrees
    let integer = angle * R2D / 45 < 0 ? Math.ceil(angle * R2D / 45) : Math.floor(angle * R2D / 45)
    // check the angle first at 45 deg and then evenry 90 deg
    switch (integer) {
        case 0:
            delete targetElement.dataset.orient
            break;
        case 1:
            targetElement.dataset.orient = 'L'
            break;
        case 3:
            targetElement.dataset.orient = 'LL'
            break;
        case 5:
            targetElement.dataset.orient = 'LLL'
            break;
        case -1:
            targetElement.dataset.orient = 'R'
            break;
        default:
            break;
    }
}
const createSizeBadge = (): void => {
    if (!resizeBadge) {
        resizeBadge = document.createElement('span')
        resizeBadge.classList.add('size-badge')
        document.body.appendChild(resizeBadge)
    }
}
const updateSizeBadge = (coord: Coordinates, type: BadgeTypes = 'resize') => {
    if (!resizeBadge || !resizerHolder) {
        return
    }
    resizeBadge.style.left = `${coord.x + 10}px`
    resizeBadge.style.top = `${coord.y + 10}px`
    if (type === 'resize') {
        resizeBadge.innerText = `${parseFloat(resizerHolder.style.width).toFixed(1)} × ${parseFloat(resizerHolder.style.height).toFixed(1)}`
    } else if (type === 'move') {
        resizeBadge.innerText = `x:${parseFloat(resizerHolder.style.left).toFixed(1)}  y:${parseFloat(resizerHolder.style.top).toFixed(1)}`
    } else if (type === 'rotate') {
        resizeBadge.innerText = `${(angle * R2D).toFixed(1)}°`
    } else {
        console.warn('nothing to show in the badge')
    }
}
const getCurrentRotation = (): number => {
    //targetElement.style.transform.match(/\d+/)
    const a = getComputedStyle(targetElement).getPropertyValue('--angle')
    let n
    if (a) {
        n = parseFloat(a)
    } else {
        n = 0
    }
    return normalizeDegrees(n)
}

const updateRectangle = (rectangle: newTargetElementRectangle): void => {
    let { x, y, width, height } = rectangle

    x = x ? x : parseFloat(targetElement.style.left)
    y = y ? y : parseFloat(targetElement.style.top)
    width = width ? width : parseFloat(targetElement.style.width)
    height = height ? height : parseFloat(targetElement.style.height)

    targetElement.style.left = `${Math.round(x)}px`
    targetElement.style.top = `${Math.round(y)}px`
    targetElement.style.width = `${Math.round(width)}px`
    targetElement.style.height = `${Math.round(height)}px`

    if (resizerHolder) {
        resizerHolder.style.left = `${Math.round(x)}px`
        resizerHolder.style.top = `${Math.round(y)}px`
        resizerHolder.style.width = `${Math.round(width)}px`
        resizerHolder.style.height = `${Math.round(height)}px`
    }

}
const resizeHandler = (coord: Coordinates, left = false, top = false, xResize = false, yResize = false) => {

    var wDiff = coord.x - mousePress.x
    var hDiff = coord.y - mousePress.y
    var rotatedWDiff = cosFraction * wDiff + sinFraction * hDiff;
    var rotatedHDiff = cosFraction * hDiff - sinFraction * wDiff;

    var newW = initW, newH = initH, newX = initX, newY = initY;

    if (xResize) {
        if (left) {
            newW = initW - rotatedWDiff;
            if (newW < minWidth) {
                newW = minWidth;
                rotatedWDiff = initW - minWidth;
            }
        } else {
            newW = initW + rotatedWDiff;
            if (newW < minWidth) {
                newW = minWidth;
                rotatedWDiff = minWidth - initW;
            }
        }
        newX += 0.5 * rotatedWDiff * cosFraction;
        newY += 0.5 * rotatedWDiff * sinFraction;
    }

    if (yResize) {
        if (top) {
            newH = initH - rotatedHDiff;
            if (newH < minHeight) {
                newH = minHeight;
                rotatedHDiff = initH - minHeight;
            }
        } else {
            newH = initH + rotatedHDiff;
            if (newH < minHeight) {
                newH = minHeight;
                rotatedHDiff = minHeight - initH;
            }
        }
        newX -= 0.5 * rotatedHDiff * sinFraction;
        newY += 0.5 * rotatedHDiff * cosFraction;
    }
    console.log({ x: newX, y: newY, height: newH, width: newW })
    updateRectangle({ x: newX, y: newY, height: newH, width: newW })
}

const normalizeDegrees = (degrees: number): number => {
    return ((degrees % 360) + 360) % 360
}