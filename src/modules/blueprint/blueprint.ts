type Directions = 'top' | 'bottom' | 'left' | 'right' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'

import World from './world';
import { modes, Modes } from './modes';
import { useInteractions } from './interactions';
import { clamp, _requestAnimationFrame, now } from '@/utilities/utilities';
import { state }  from '@/utilities/state';

export default (body: HTMLElement) => {
  const {x: originX, y: originY} = body.getBoundingClientRect();
  const world = new World(body);
  world.showRulers();

  const MAX_ZOOM: number = 100;
  const MIN_ZOOM: number = 0.1;

  const interactions = useInteractions();

  const m = modes();
  const modeOptions: Record<string, Modes> = m.getOptions();

  let docFragment: DocumentFragment = document.createDocumentFragment();
  let smallestFrames: Array<HTMLDivElement> = [];
  let shadowDocFragment: Node;

  const totFrames: number = 10;

  for (var i = totFrames; i--;) {
    const frame: HTMLDivElement = document.createElement("div");
    const w = (Math.random() * 300 | 0)
    const h = (Math.random() * 300 | 0)
    frame.style.position = "absolute";
    frame.style.top = (Math.random() * 1500 - Math.round(totFrames * 1) | 0) + 'px';
    frame.style.left = (Math.random() * 1500 - Math.round(totFrames * 1) | 0) + 'px';
    frame.style.width = `${w}px`
    frame.style.height = `${h}px`
    frame.classList.add('frame')
    frame.innerHTML = `
	<label class="title" text> Frame ${i}</label>
	<main class="clip-content">
		<p text>
			<span class="margin-r-xs">🎃</span>pumpkin
		</p>
	</main>
	`

    if (w < 200 || h < 200) {
      frame.setAttribute('small', '')
      smallestFrames.push(frame)
    }

    docFragment.appendChild(frame)
  }

  shadowDocFragment = docFragment.cloneNode(true);
  world.wrapper.appendChild(docFragment);

  // /// TRANSFORMATIONS 

  // let smallestAlreadyRemoved : boolean = false





  // /// OPTIMISATION FEATURES

  // const optimiseScale = () => {
  // 	if (scale < 0.4 && !smallestAlreadyRemoved) {
  // 		console.log('removing smallest')
  // 		container.classList.add('small-zoom')
  // 		smallestAlreadyRemoved = true
  // 	} else if (scale >= 0.4 && smallestAlreadyRemoved) {
  // 		console.log('adding back smallest')
  // 		container.classList.remove('small-zoom')
  // 		smallestAlreadyRemoved = false
  // 	}
  // }

  // const targets : NodeList = document.querySelectorAll('div.frame')

  // const lazyLoad = (target : Node)=>{
  // const io = new IntersectionObserver((entries,observer)=>{
  // 	for (let i = 0; i < entries.length; i++) {
  // 		const div = entries[i].target
  // 		if(entries[i].isIntersecting){
  // 			div.classList.remove('hidden')
  // 			// observer.disconnect()
  // 		} else {
  // 			div.classList.add('hidden')
  // 		}
  // 	}
  // },{
  // 	// threshold:[0.05]
  // })

  // 	io.observe(target as Element)
  // }
  // 	targets.forEach(lazyLoad)

  // /// EVENTS LISTENERS


  body.onkeydown = (e) => {
    if (m.getCurrent() === modeOptions.TEXT_EDIT) return
    e.preventDefault()
    const key: string | number = e.code || e.keyCode
    console.log(key)
    if (key == 32 || key == 'Space') {
      //spacebar
      m.setCurrent(modeOptions.PAN)
      document.body.classList.add('pan-mode')
    }
  };
  body.onkeyup = (e) => {
    if (m.getCurrent() === modeOptions.TEXT_EDIT) return
    e.preventDefault()
    const key: string | number = e.code || e.keyCode
    if (key == 32 || key == 'Space') {
      //spacebar
      m.resetPrevious()
      document.body.classList.remove('pan-mode')
    }
  };

  let panning: boolean = false;
  let start = { x: 0, y: 0 };

  (body.querySelector('#world-wrapper') as HTMLElement)!.onmousedown = (e: MouseEvent) => {
    e.preventDefault();
    const target = e.target as HTMLElement

    const { pointX, pointY, scale } = world.getProperties()
    if (m.getCurrent() === modeOptions.PAN) {
      panning = true
      start = {
        x: e.clientX - (pointX || 0),
        y: e.clientY - (pointY || 0)
      }
    } else if (m.getCurrent() === modeOptions.SELECT) {
      interactions.setPrevMousePosition({ x: e.clientX / scale, y: e.clientY / scale })
      if (target.hasAttribute('resize-handle')) {
        interactions.initResize(e)
      } else if (target.hasAttribute('rotate-handle')) {
        interactions.initRotate({ x: e.clientX, y: e.clientY })
      } else {
        selectElement(target)
        interactions.initMoving(e)

      }
    }
  };

  body.onmouseup = (e) => {
    panning = false
    interactions.endResize()
    interactions.endMove()
    interactions.endRotate()
  };

  body.onmousemove = (e) => {
    if (world.updating || interactions.isRunning()) {
      return
    }
    e.preventDefault();
    const projectedCoord = world.getProjectedPoint({ x: e.clientX, y: e.clientY })
    if (panning) {
      const x = (e.clientX - start.x)
      const y = (e.clientY - start.y)
      world.move({ x, y })
    } else if (interactions.isMoving()) {
      const { scale } = world.getProperties()
      interactions.move(
        { x: e.pageX, y: e.pageY },
        { x: e.clientX / scale, y: e.clientY / scale }
      )
    } else if (interactions.isResizing()) {
      const { scale } = world.getProperties()
      interactions.resize(
        { x: e.pageX, y: e.pageY },
        { x: e.clientX / scale, y: e.clientY / scale }
      )
    } else if (interactions.isRotating()) {
      interactions.rotate(
        { x: e.pageX, y: e.pageY },
        { x: e.clientX, y: e.clientY }
      )
    }
  };

  // window.onmousedown = (e : MouseEvent) => {
  // 	if (!needForRAF || isEditingText) {
  // 		return
  // 	}
  // 	e.preventDefault()

  // 	const target = e.target as HTMLElement
  // 	if (selectedMode === modes.PAN) {
  // 		start = {
  // 			x: e.clientX - pointX,
  // 			y: e.clientY - pointY
  // 		}
  // 		panning = true

  // 	} else if (selectedMode === modes.SELECT || prevClickedElement) {
  // 		if (target.hasAttribute('resize-handle')) {
  // 			initResize(e)
  // 		} else {
  // 			initMoving(e)
  // 		}
  // 	}
  // }

  // window.onmouseup = (e) => {
  // 	panning = false
  // 	resizing = false
  // 	moving = false
  // 	// TODO change the logic to something more explicit like if resize is over
  // 	if (resizeBadge && prevClickedElement) {
  // 		if (parseInt(prevClickedElement.style.width) < 200 || parseInt(prevClickedElement.style.height) < 200) {
  // 			prevClickedElement.setAttribute('small', '')
  // 		} else {
  // 			prevClickedElement.removeAttribute('small')
  // 		}
  // 		resizeBadge.remove()
  // 	}
  // }

  body.onwheel = (e: WheelEvent) => {
    if (world.updating) {
      return;
    }
    let { pointX, pointY, scale } = world.getProperties();
    let x: number = 0;
    let y: number = 0;
    if (e.ctrlKey) {
      // zoom/scale factor
      const xs = ((e.clientX - originX) - pointX) / scale;
      const ys = ((e.clientY - originY) - pointY) / scale;
      /// Alternative way to scale up and down
      // const  delta = (e.wheelDelta ? e.wheelDelta : -e.deltaY);
      // (delta > 0) ? (scale *= 1.1) : (scale /= 1.1);
      scale -= e.deltaY * 0.03 * scale;
      scale = clamp(scale, MIN_ZOOM, MAX_ZOOM);
      x = (e.clientX - originX) - xs * scale;
      y = (e.clientY - originY) - ys * scale;
      // optimiseScale()
    } else {
      /// trackpad X and Y positions
      x = pointX - e.deltaX * 2;
      y = pointY - e.deltaY * 2;
    }
    world.moveAndZoom({ x, y }, scale)
  };

  body.addEventListener(
    "wheel",
    (e) => {
      e.preventDefault();
    },
    { passive: false }
  );
  // window.onclick = (e : MouseEvent) => {
  // 	console.log(e.target)
  // 	const target = e.target as HTMLElement
  // 	if (
  // 		(selectedMode === modes.PAN || panning) ||
  // 		target.hasAttribute('resizer') || target.hasAttribute('resize-handle')
  // 	 ) 
  // 	 {
  // 		 return
  // 	}
  // 	//handling text layers
  // 	if (target.hasAttribute('text')) {
  // 		if (prevClickedElement && prevClickedElement !== target) {
  // 		prevClickedElement.contentEditable = 'false'
  // 		target.removeEventListener('focus', () => { setEditTextMode(false)}, false)
  // 		}
  // 		target.contentEditable = 'true'
  // 		target.addEventListener('focus', () => {setEditTextMode(true)}, false)

  // 		setTimeout(function() {
  // 			if (document.activeElement !== e.target) {
  // 				target.contentEditable = 'false'
  // 				target.removeEventListener('focus', () => { setEditTextMode(false) }, false)
  // 			}
  // 		}, 500)
  // 	} else {
  // 		if (prevClickedElement) {
  // 			prevClickedElement.contentEditable = 'false'
  // 		}
  // 		setEditTextMode(false)
  // 	}
  // 	if (!resizing) {
  // 		if (prevClickedElement) {
  // 			deselectElement(prevClickedElement)
  // 		}
  // 		selectElement(target)
  // 	}


  // }
  // const setEditTextMode = (state : boolean) => {
  // 	isEditingText = state
  // }

  const selectElement = (el: HTMLElement) => {
    console.log(el)
    deselectElement(interactions.getTarget())
    if (el === document.body) {
      return
    } else if (el === interactions.getResizeHolder()) {
      return
    }
    if (el.tagName === 'MAIN' || el.tagName === 'LABEL') {
      el = el.parentElement ? el.parentElement : el
    }
    const { x, y, width, height } = el.getBoundingClientRect()
    console.log(el, el.getBoundingClientRect())
    const { pointX, pointY, scale } = world.getProperties()
    const a = getComputedStyle(el).getPropertyValue('--angle')
    let n
    if (a) {
      n = parseFloat(a)
    } else {
      n = 0
    }

    let angle = interactions.normalizeDegrees(n)
    // IF I use innerHTML the reference gets lost. This because innerHTML recreate the entire thing. I will use the createElement instead
    const mainDiv = document.createElement('div')
    mainDiv.classList.add('resizer')
    mainDiv.setAttribute('resizer', '')
    mainDiv.style.cssText = `
	width: ${el.clientWidth}px;
	height: ${el.clientHeight}px;
	left: ${((x + width / 2) - pointX) / scale}px;
	top: ${((y + height / 2) - pointY) / scale}px;
	`
    // transform: rotate(${angle}deg)
    mainDiv.style.setProperty('--angle', `${angle}deg`)

    const resizersConfiguration: Record<string, Array<Directions>> = {
      full: ['top', 'bottom', 'left', 'right'],
      corner: ['top-left', 'top-right', 'bottom-left', 'bottom-right']
    }
    const rotateConfiguration: Array<Directions> = ['top-left', 'top-right', 'bottom-left', 'bottom-right']
    rotateConfiguration.forEach(className => {
      const div = document.createElement('div')
      div.setAttribute('rotate-handle', '')
      div.classList.add('rotate-handle')
      div.classList.add(className)
      mainDiv.appendChild(div)
    })
    for (const key in resizersConfiguration) {
      if (Object.hasOwnProperty.call(resizersConfiguration, key)) {
        resizersConfiguration[key].forEach(className => {
          const div = document.createElement('div')
          div.setAttribute('resize-handle', '')
          div.classList.add(key)
          div.classList.add(className)
          mainDiv.appendChild(div)
        })
      }
    }
    interactions.setResizeHolder(mainDiv)
    interactions.setTarget(el)
    world.wrapper.appendChild(mainDiv)
  }

  const deselectElement = (el: HTMLElement) => {
    console.log('PDDD')
    interactions.clean()
    // prevClickedElement
  }

  body.addEventListener('resize', () => console.log('heey'));

  // /// RENDERING (optional)
  let previousTime = now();
  let frameCount = 0
  function render() {
  	var nextTime = now();
  	var deltaTime = (nextTime - previousTime) / 1000;
  	frameCount++;
  	if (deltaTime > 1) {
      state.fps = parseFloat((frameCount / deltaTime).toFixed(1));
  		previousTime = nextTime;
  		frameCount = 0;
  	}

  	_requestAnimationFrame(render);
  }


  render();
};


