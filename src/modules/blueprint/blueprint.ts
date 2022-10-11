type Directions = 'top' | 'bottom' | 'left' | 'right' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'

import World from './world';
import { modes, Modes } from './modes';
import { useInteractions } from './interactions';
import { clamp, _requestAnimationFrame, now, randomNamedColor, uuidv4 } from '@/utilities/utilities';
import { state } from '@/utilities/state';

import Tree from '@/models/tree';
import * as fileType from '../../config/fileType.json';

import { getFileCtrl } from '@/controllers/files';
import { getPlugin } from '@/api/plugin'

export default (body: HTMLElement) => {
  const { x: originX, y: originY } = body.getBoundingClientRect();
  body.style.setProperty('--origin-x', `${originX}px`);
  body.style.setProperty('--origin-y', `${originY}px`);
  const world = new World(body);
  world.showRulers();

  const MAX_ZOOM: number = 100;
  const MIN_ZOOM: number = 0.1;

  const interactions = useInteractions();

  const m = modes();
  const modeOptions: Record<string, Modes> = m.getOptions();

  const forms = document.forms as Forms;
  const form = forms['rooms-navigation'];
  const addRoom = () => rooms.insert(rootKey, uuidv4(), { type: 'room', world: world.getProperties() });

  form.elements['add-room'].onclick = addRoom;
  const renderRoomTab = (room: string, active?: string): void => {
    const tabs = document.getElementById('rooms-navigation');
    const template = ((
      document
        .querySelector(`#tab-template`) as HTMLTemplateElement)!
      .content.cloneNode(true) as DocumentFragment)
      .firstElementChild;

    const tabContent = template!.querySelector('.color-icon') as HTMLElement;
    const tabName = template!.querySelector('.room-name');
    const input = template!.querySelector('input');
    const close = template!.querySelector('button[name="close"]') as HTMLButtonElement;

    const colorName = randomNamedColor(room);
    tabName!.innerHTML = colorName;
    tabContent!.style.backgroundColor = colorName;
    template?.setAttribute('data-status', room === active ? 'active' : '');
    input!.value = room;
    input!.onchange = form!.onsubmit = () => changeRoom(Object.fromEntries(new FormData(form) as any)['active-room']);
    close!.onclick = () => rooms.remove(room);
    tabs?.appendChild(template!);
  }
  const loadRoom = (room: string) => {
    const node = rooms.find(room);
    if (!node) { return }
    const { children, value } = node
    world.moveAndZoom({x: value.world.pointX, y: value.world.pointY}, value.world.scale);
    children.forEach(child => {
      const { value, key } = child;
      const { x,y,title,type,width,height, originalKey } = value;
      createFrame({ x, y }, { width, height }, { type, title, key, originalKey });
    });
  }
  const changeRoom = (room: string): void => {
    // update the state
    state.activeRoom = room;
    // select the tab with the room id
    const input = form.querySelector(`input[value="${room}"]`);
    //remove the active status from every tab
    form.querySelectorAll(`input`).forEach((item: HTMLInputElement) => item!.parentElement!.setAttribute('data-status', ''));
    // add the active status to the newly selected tab
    input!.parentElement.setAttribute('data-status', 'active');
    input!.checked = true;

    // remove all the visualised frames of the current room
    body.querySelectorAll('.frame').forEach(frame => frame.remove());
    interactions.clean();
    loadRoom(room);
  }
  const createFrame = (
    { x, y }: Coordinates,
    { width, height }: { width: number, height: number}, 
    { type, title, key }: { type:FileType, title: string, key:string, originalKey: string}
    ) => {

    let docFragment: DocumentFragment = document.createDocumentFragment();
    let smallestFrames: Array<HTMLDivElement> = [];

    const frame: HTMLDivElement = document.createElement("div");
    frame.style.position = "absolute";
    frame.style.left = `${x}px`;
    frame.style.top = `${y}px`;
    frame.style.width = `${width || 200 }px`;
    frame.style.height = `${height || 200}px`;
    frame.setAttribute('data-key', key);
    frame.classList.add('frame');
    frame.setAttribute('draggable', '');
    frame.innerHTML = `
      <label class="title" draggable text data-icon="${fileType[type] as unknown as FileTypes}">${title}</label>
      <main class="clip-content">
      </main>
    `;

    if (width < 200 || height < 200) {
      frame.setAttribute('small', '')
      smallestFrames.push(frame)
    }

    docFragment.appendChild(frame)
    const { elementName } = getPlugin(type)!
    const elm = document.createElement(elementName)
    elm.setAttribute('name', title)
    console.log('plugin code')
      
    frame.querySelector('main')!.appendChild(elm)
      
    world.wrapper.appendChild(docFragment);

    return frame
  }
  const updateFrame = (key: string, value: any) => {
    const frame: HTMLDivElement = document.querySelector(`.frame[data-key="${key}"]`)!
    if (!frame) { return }
    const label: HTMLLabelElement = frame!.querySelector(`.title[text]`)!
    const { x, y, width, height, title} = value
    frame.style.position = "absolute";
    frame.style.left = `${x}px`;
    frame.style.top = `${y}px`;
    frame.style.width = `${width || 200 }px`;
    frame.style.height = `${height || 200}px`;
    label.innerText = title
  }

  const checkTabsNumber = () => {
    const tabs =  form.querySelectorAll(`input`);
    tabs.forEach((tab : HTMLInputElement) => {
      const close = tab.parentElement!.querySelector('button[name="close"]') as HTMLButtonElement;
      close.disabled = false;
    });
    if (tabs.length === 1) {
      const close = tabs[0].parentElement!.querySelector('button[name="close"]') as HTMLButtonElement;
      close.disabled = true;
    }
  }

  let rootKey = '';
  let lastRoomkey = '';
  const rooms = new Tree(new class {
    onInit(key: string) {
      rootKey = key;
    }
    onAdd(_parent: string, key: string, value: any) {
      const { type, x, y, width, height, title, originalKey } = value;
      if (type === 'room') {
        renderRoomTab(key);
        lastRoomkey = key;
      } else {
        createFrame({ x, y }, {width, height}, { type, title, key, originalKey });

      }
      checkTabsNumber();
    }
    onRemove(key: string) {
      const tab = form.querySelector(`input[value="${key}"]`);
      const frame =  body.querySelector(`[data-key="${key}"]`);
      if (tab) {
        const otherTab = form.querySelector(`input:not([value="${key}"])`);
        tab.parentElement.remove();
        changeRoom(otherTab.value);
      } else if(frame) {
        frame.remove();
      }
      checkTabsNumber();
    }
    onUpdate(key: string, value: any) {
      updateFrame(key, value)
    }
  }, { storageKey: 'rooms' });

  if (!rooms.root.children.length) {
    addRoom();
  }

  changeRoom(lastRoomkey);

  const fileCtrl = getFileCtrl();
  const observeFiles = new class {
    onRemove(key: string): void{
      for (let node of rooms.preOrderTraversal()) {
        if (node.value!.originalKey === key) {
          rooms.remove(node.key)
        }
      }
      
    }
    onUpdate(key: string, value: any): void{
      for (let node of rooms.preOrderTraversal()) {
        if (node.value!.originalKey === key) {
          console.log(key, value)
          rooms.update(node.key, {...value})
        }
      }
    }
  }
  fileCtrl?.addClient(observeFiles);
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


  document.body.onkeydown = (e) => {
    if (m.getCurrent() === modeOptions.TEXT_EDIT) return
    // e.preventDefault();
    const key: string | number = e.code || e.keyCode || e.key
    if (key == 32 || key == 'Space') {
      //spacebar
      m.setCurrent(modeOptions.PAN)
      body.classList.add('pan-mode')
    }
  };
  document.body.onkeyup = (e) => {
    if (m.getCurrent() === modeOptions.TEXT_EDIT) return
    // e.preventDefault();
    const key: string | number = e.code || e.keyCode
    if (key == 32 || key == 'Space') {
      //spacebar
      m.resetPrevious();
      body.classList.remove('pan-mode');
    } else if (key == 8 || key == 46 || key == 'Delete' || key == 'Backspace') {
      const k = interactions.getTarget()!.getAttribute('data-key');
      if (k) {
        deselectElement(interactions.getTarget());
        rooms.remove(k);
      }
    }
  };

  let panning: boolean = false;
  let start = { x: 0, y: 0 };

  body!.onmousedown = (e: MouseEvent) => {

    e.preventDefault();
    const target = e.target as HTMLElement;

    const { pointX, pointY, scale } = world.getProperties();
    if (m.getCurrent() === modeOptions.PAN) {
      panning = true;
      start = {
        x: e.clientX - (pointX || 0),
        y: e.clientY - (pointY || 0)
      };
    } else if (m.getCurrent() === modeOptions.SELECT) {
      interactions.setPrevMousePosition({ x: e.clientX / scale, y: e.clientY / scale });
      if (target.hasAttribute('resize-handle')) {
        interactions.initResize(e);
      } else if (target.hasAttribute('rotate-handle')) {
        interactions.initRotate({ x: e.clientX, y: e.clientY });
      } else if (target.hasAttribute('draggable')) {
        selectElement(target);
        interactions.initMoving(e);
      } else {
        deselectElement(interactions.getTarget());
      }
    }
  };

  body.onmouseup = (_e) => {
    panning = false
    interactions.endResize()
    interactions.endMove()
    interactions.endRotate()
    const target = interactions.getTarget();
    const targetKey = target!.getAttribute('data-key');
    const { width, height, top, left } = target.style;
    if (targetKey)
      rooms.update(targetKey, {x: parseFloat(left), y: parseFloat(top), width: parseFloat(width), height: parseFloat(height)})
  };

  body.onmousemove = (e) => {
    if (world.updating || interactions.isRunning()) {
      return
    }
    e.preventDefault();
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

    rooms.update(state.activeRoom, { world: world.getProperties() });
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

  body.ondblclick = (e: MouseEvent) => {
  	const target = e.target as HTMLElement
    if (target.hasAttribute('text')) {
      console.log(target)
      target.contentEditable = 'true'
      target.focus()
      target.onblur = () => {
        target.removeAttribute('contentEditable')
        const parentKey = target.parentElement?.dataset.key
        if (parentKey) {
          const node = rooms.find(parentKey)
          fileCtrl?.update(node!.value!.originalKey, {title: target.innerText})
        }
      }

    }
  }
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
    deselectElement(interactions.getTarget());
    if (el === body) {
      return;
    } else if (el === interactions.getResizeHolder()) {
      return;
    }
    if (el.tagName === 'MAIN' || el.tagName === 'LABEL') {
      el = el.parentElement ? el.parentElement : el
    }
    const { x, y, width, height } = el.getBoundingClientRect()
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

  const deselectElement = (_el: HTMLElement) => {
    interactions.clean()
    // prevClickedElement
  }


  /// RENDERING (optional)
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

  document.addEventListener('blueprintdrop', (e) => {
    const { coord, content: keys } = (e as CustomEvent).detail;
    const tree = new Tree(new class {});

    const { x, y } = world.getProjectedPoint({ x: coord.x - originX, y: coord.y - originY });
    keys.forEach((key: string) => {
      const node = tree.find(key)
      if (!node) {return}
      const { value } = node
      rooms.insert(state.activeRoom, uuidv4(), { originalKey: key, ...value, x: -x, y: -y });
    });
  });
  render();
};


