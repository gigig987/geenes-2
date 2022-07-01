import './style.css'
import '@/utilities/utility.css'
import './reactivity.css'

import ModeModel from './models/mode';
import blueprint from './modules/blueprint/blueprint';
import './modules/blueprint/blueprint.css';

import { state }  from '@/utilities/state';

interface Forms { [key: string]: any }

const modules = new Map();
modules.set('sign-in', './sign-in');
// modules.set('files', './modules/files-handler');

const forms = document.forms as Forms;

const setOverlay = async () => {
  const name = location.hash.slice(2);
  if (modules.get(name)) {
    forms.overlay!.elements.show.checked = true;
    const slot = forms.overlay?.getElementsByTagName('article')[0]
    slot!.innerHTML = modules.get(name)[0];
    modules.get(name)[1]();
  } else {
    clearOverlay();
  }
};

const clearOverlay = () => {
  history.pushState("", document.title, window.location.pathname + window.location.search);
  const forms = document.forms as Forms;
  forms.overlay!.elements.show.checked = false;
  const slot = forms.overlay?.getElementsByTagName('article')[0]
  slot!.innerHTML = '';
}

forms.overlay!.elements.close.addEventListener("click", (e: Event) => {
  e.preventDefault();
  clearOverlay();
});


const resizeProjectNameField = (): void => {
  const field = forms.project!.elements.name
  field.size = field.value.length || 1;
}

const loadBlueprint = (): void => {
  const container = document.getElementById('blueprint');
  blueprint(container!);
}

const firstLoad = (): void => {
  setOverlay();
  resizeProjectNameField();
  loadBlueprint();
}



// const currentProject = new ProjectModel(new class {
// 	onAdd(key, value) {
//     const form = forms.project
//     console.log(new FormData(form));
// 		form!.elements.name.onchange = form!.onsubmit = () => currentProject.updateProject(key,  Object.fromEntries(new FormData(form)));
//     form!.elements.name.addEventListener('dblclick', ({ target }) => {
//       if (target && target instanceof Element) {
//         target.removeAttribute('readonly')
//       }
//     });
//     form!.elements.name.addEventListener('input', resizeProjectNameField);
//     form!.elements.name.addEventListener('keypress', (e: KeyboardEvent) => {
//       const { target, key } = e;
//       if (target && target instanceof HTMLInputElement) {
//         if (key === ' ') { target.removeAttribute('readonly') }
//         if (key === 'Enter') { e.preventDefault(); target.blur();}
//       }
//     });
//     form!.elements.name.addEventListener('blur', ({ target }) => {
//       if (target && target instanceof Element) {
//         target.setAttribute('readonly', '')
//       }
//     });
    
//     this.onUpdate(key, value, form);
// 	}

// 	onUpdate(key, {name, preferences}, form = document.forms['project']) {
// 		form.elements.name.value = name;
//     // document.forms.navigation.elements.main.value = preferences.mode;
// 		form.elements.name.blur();
// 	}

// 	onRemove(key) { document.forms[`task-${key}`].remove(); }

// });

window.addEventListener('hashchange', setOverlay);
window.addEventListener('load', firstLoad);
document.body.addEventListener('submit', e => e.preventDefault(), {capture: true});


// Navigation

const form = forms.navigation;
form!.elements.main.forEach((radio: HTMLFormElement) => {
  radio.onchange = form!.onsubmit = () => modeCtrl.changeMode(Object.fromEntries(new FormData(form) as any)['main']);
}); 

const modeCtrl = new ModeModel(new class {
  async onChange(value: string, _old: string) {
    console.log(value)
    form!.elements.main.value = value;

    let template;
    let code;
    if (value === 'files') {
      template = await import(`./modules/files-handler.html?raw`);
      code = await import(`./modules/files-handler`);
    } else {
      return;
    }
    form!.elements[value as string].innerHTML = template.default;//modules.get(value)[0];
    code.default();
  }
});

// Footer
const fpsCounter = document.querySelector('footer .fps-counter');

const renderFpsCounter = () => {
  fpsCounter!.innerHTML = `${state.fps} FPS`;
};


// Subscribe the render function to state changes
window.subscribers.push(renderFpsCounter);