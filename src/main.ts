import './style.css'
import './utilities/utility.css'
import './reactivity.css'

import signInTemplate from './sign-in.html?raw';
import signInCode from './sign-in';

import filesHandlerTemplate from './modules/files-handler.html?raw';
import filesHandlerCode from './modules/files-handler';

// import ProjectModel from './models/project';
import ModeModel from './models/mode';

interface Forms { [key: string]: any }

const modules = new Map();
modules.set('sign-in', [signInTemplate, signInCode]);
modules.set('files', [filesHandlerTemplate, filesHandlerCode]);

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

const firstLoad = (): void => {
  setOverlay();
  resizeProjectNameField();
  // currentProject.createProject({name: 'ciaoooo'});
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

const modeCtrl = new ModeModel(new class {
  onChange(value: string, _old: string) {
    const form = forms.navigation;
    form!.elements.main.value = value;
    form!.elements[value as string].innerHTML = modules.get(value)[0];
    modules.get(value)[1]();
    form!.elements.main.forEach((radio: HTMLFormElement) => {
      radio.onchange = form!.onsubmit = () => modeCtrl.changeMode(Object.fromEntries(new FormData(form) as any)['main']);
    }); 
  }
});