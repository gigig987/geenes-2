import Tree from './tree';
import { Data, key } from './tree';
import * as fileType from '../config/fileType.json';
import { uuidv4 } from '@/utilities/utilities';
import './files-handler.css'

declare global {
  interface Window {
    opera: any;
  }
}

interface Forms { [key: string]: any }

interface DraggableFormsElements extends HTMLFormControlsCollection {
  title: HTMLInputElement;
}

export type draggableItem = HTMLFormElement;
export interface draggableElements {
  items: Array<draggableItem>
  owner: null | ParentNode
  droptarget: null | HTMLFormElement
}
export default () => {
  //exclude older browsers by the features we need them to support
  //and legacy opera explicitly so we don't waste time on a dead browser
  if
    (
    !document.querySelectorAll
    ||
    !('draggable' in document.createElement('span'))
    ||
    window.opera
  ) { return; }
  
  const _ = document.getElementById('file-handler');
  if(!_) { return; }
  
  // Tree data structure
  const tree = new Tree(new class {
    onInit(key: number): void{
      // assign to the root element the root key
      const form = _.querySelector('ol')!.parentNode;
      if (form instanceof HTMLFormElement) {
        form.name = `file_${key}`;
      }
    }

    onAdd(parentKey: key, key: key, { type, title } : Data) {
    // depending on the type load the right template
    // FOLDER | FILE_...
    const template = ((
      document
      .querySelector(`#${type.toLowerCase().split('_')[0]}-template`) as HTMLTemplateElement)!
      .content.cloneNode(true) as DocumentFragment)
      .firstElementChild;
    
    // get the firt, main form of the template
    const form = template!.querySelector('form');
    
    //assign to the fomr the key of the tree node
    if (form instanceof HTMLFormElement) {
      form.name = `file_${key}`;
      const input = (form!.elements as DraggableFormsElements).title;
      input.onchange = form!.onsubmit = () => tree.update(key,  Object.fromEntries(new FormData(form)));
      input.addEventListener('blur', ({ target }) => {
        if (target && target instanceof HTMLInputElement) {
          target.setAttribute('readonly', '');
          target.setAttribute('disabled', '');
          if (!target.value) {
            const key = target.form!.name.split('_')[1];
            tree.remove(key);
          }
        }
      });
      input.addEventListener('keypress', (e: KeyboardEvent) => {
        const { target, key } = e;
        if (target && target instanceof HTMLInputElement) {
          if (key === 'Enter') { e.preventDefault(); target.blur(); }
        }
      });
      form.addEventListener('submit', ({submitter: {name}}: {submitter: any}) => {
        if (name === 'delete') {
          tree.remove(key);
        } else if (name === 'rename') {
          // rename functionality with autofocus
          input.removeAttribute('readonly');
          input.removeAttribute('disabled');
          input.focus();
          input.select();
        } else if (name === 'move') {
          // TODO implement move status for keyboard move
        }
       });
       // reference to the document forms
       const forms = document.forms as Forms;
       
       // render the tree node name in an input
       input.value = `${title}`;

       // if there is an element before the input fill it the icon type
       if (input.previousElementSibling)
       input.previousElementSibling.textContent = `${fileType[type]}`;
       
       // finally render the new element in the <ol>
       forms[`file_${parentKey}`].querySelector('ol').appendChild(template);

       if (!title) {
        input.removeAttribute('readonly');
        input.removeAttribute('disabled');
        input.focus();
       }
      }
    }

    onMove(parentKey: key, key: key) {
      // reference to the document forms
      const forms = document.forms as Forms;
      // append to the new form the selected element
      // parentElement is the container of the form and the first element in the template hierarchy
      forms[`file_${parentKey}`].querySelector('ol').appendChild(forms[`file_${key}`].parentElement);
    }
    onRemove(key: key) {
      // reference to the document forms
      const forms = document.forms as Forms;
      // remove the selected element from its container form
      // parentElement is the container of the form and the first element in the template hierarchy
      forms[`file_${key}`].parentElement.remove();
      clearSelections();
    }
    onUpdate(key: key, { type, title } : Data): void {
      // reference to the document forms
      const forms = document.forms as Forms;
      // update the selected element
      const input = (forms[`file_${key}`]!.elements as DraggableFormsElements).title;

      input.value = `${title}`;
      // if there is an element before the input fill it the icon type
      if (input.previousElementSibling)
      input.previousElementSibling.textContent = `${fileType[type]}`;
    }
  });

  //dictionary for storing the selections data 
  //comprising an array of the currently selected items 
  //a reference to the selected items' owning container
  //and a refernce to the current drop target container
  let selections : draggableElements =
  {
    items: [],
    owner: null,
    droptarget: null
  };

  let targets: NodeListOf<HTMLElement>;
  let items: NodeListOf<HTMLElement>;
  const refreshElements = () => {
    targets = _.querySelectorAll('[data-drop="true"]');
    items = _.querySelectorAll('[draggable="true"]');
  }
  //function for selecting an item
  const addSelection = (item: HTMLFormElement): void => {
    // ol(container) > li(draggable) > form(item, key)
    //if the owner reference is still null, set it to this item's parent
    //so that further selection is only allowed within the same container
    if (!selections.owner) {
      selections.owner = getContainerForm(item.parentNode!);
    }

    //or if that's already happened then compare it with this item's parent
    //and if they're not the same container, return to prevent selection
    // else if (selections.owner !== getContainerForm(item.parentNode!)) {
    //   return;
    // }

    //set this item's grabbed state
    item.parentElement!.setAttribute('aria-grabbed', 'true');
    //add it to the items array
    selections.items.push(item);
  }

  //function for unselecting an item
  const removeSelection = (item: HTMLFormElement): void => {
    //reset this item's grabbed state
    item.parentElement!.setAttribute('aria-grabbed', 'false');

    //then find and remove this item from the existing items array
    for (var len = selections.items.length, i = 0; i < len; i++) {
      if (selections.items[i] === item) {
        selections.items.splice(i, 1);
        break;
      }
    }
  }
  //function for resetting all selections
  const clearSelections = (): void => {
    //if we have any selected items
    if (selections.items.length) {
      //reset the owner reference
      selections.owner = null;

      //reset the grabbed state on every selected item
      for (var len = selections.items.length, i = 0; i < len; i++) {
        selections.items[i].parentElement!.setAttribute('aria-grabbed', 'false');
      }

      //then reset the items array        
      selections.items = [];
    }
  }

  //shorctut function for testing whether a selection modifier is pressed
  const hasModifier = (e: KeyboardEvent| MouseEvent): boolean => {
    return (e.ctrlKey || e.metaKey || e.shiftKey);
  }

  // function for applying dropeffect to the target containers
  const addDropeffects = (): void => {

    //apply aria-dropeffect and tabindex to all targets apart from the owner
    for (var len = targets.length, i = 0; i < len; i++) {
      if
        (
        targets[i] != selections.owner
        &&
        targets[i].getAttribute('aria-dropeffect') == 'none'
      ) {
        targets[i].setAttribute('aria-dropeffect', 'move');
        // targets[i].setAttribute('tabindex', '0');
      }
    }

    //remove aria-grabbed and tabindex from all items inside those containers
    for (var len = items.length, i = 0; i < len; i++) {
      if
        (
        items[i].parentNode != selections.owner
        &&
        items[i].getAttribute('aria-grabbed')
      ) {
        items[i].removeAttribute('aria-grabbed');
        // items[i].removeAttribute('tabindex');
      }
    }
  }

  //function for removing dropeffect from the target containers
  const clearDropeffects = (): void => {
    //if we have any selected items
    if (selections.items.length) {
      //reset aria-dropeffect and remove tabindex from all targets
      for (var len = targets.length, i = 0; i < len; i++) {
        if (targets[i].getAttribute('aria-dropeffect') != 'none') {
          targets[i].setAttribute('aria-dropeffect', 'none');
          // targets[i].removeAttribute('tabindex');
        }
      }

      //restore aria-grabbed and tabindex to all selectable items 
      //without changing the grabbed value of any existing selected items
      for (var len = items.length, i = 0; i < len; i++) {
        if (!items[i].getAttribute('aria-grabbed')) {
          items[i].setAttribute('aria-grabbed', 'false');
          // items[i].setAttribute('tabindex', '0');
        }
        else if (items[i].getAttribute('aria-grabbed') == 'true') {
          // items[i].setAttribute('tabindex', '0');
        }
      }
    }
  }

  //shortcut function for identifying an event element's target container
  // const getContainer = (element: ParentNode | null): HTMLElement | null => {
  //   do {
  //     if (element!.nodeType == 1 && (element as Element).getAttribute('aria-dropeffect')) {
  //       return element as HTMLElement;
  //     }
  //   }
  //   while (element = element!.parentNode);

  //   return null;
  // }
  //shortcut function for identifying an event element's target container
  const getContainerForm = (element: ParentNode | null): HTMLFormElement | null => {
    do {
      if (element!.nodeType == 1 && (element as Element).tagName === 'FORM') {
        return element as HTMLFormElement;
      }
    }
    while (element = element!.parentNode);

    return null;
  }
  //mousedown event to implement single selection
  _.addEventListener('mousedown', function (e) {
    // get the form containing the clicked target
    if (e.target! instanceof HTMLElement) {
     const form = getContainerForm(e.target);

    //if the element is a draggable item. the form is always contained within a li
    if (form!.parentElement!.getAttribute('draggable')) {
      refreshElements();
      //clear dropeffect from the target containers
      clearDropeffects();

      //if the multiple selection modifier is not pressed 
      //and the item's grabbed state is currently false
      if
        (
        !hasModifier(e)
        &&
        form!.parentElement!.getAttribute('aria-grabbed') === 'false'
      ) {
        //clear all existing selections
        clearSelections();
        //then add this new selection
        addSelection(form!);
      }
    }

    //else [if the element is anything else]
    //and the selection modifier is not pressed 
    else if (
      !hasModifier(e)
      &&
      ((e.target as HTMLButtonElement).name !== 'new-file' &&  (e.target as HTMLButtonElement).name !== 'new-folder')
      ) {
      //clear dropeffect from the target containers
      clearDropeffects();
      //clear all existing selections
      clearSelections();
    }

    //else [if the element is anything else and the modifier is pressed]
    else {
      //clear dropeffect from the target containers
      clearDropeffects();

    }

  }
  }, false);

  //mouseup event to implement multiple selection
  _.addEventListener('mouseup', function (e) {
    // get the form containing the clicked target
    if (e.target !instanceof HTMLElement) {
      const form = getContainerForm(e.target);
      //if the element is a draggable item 
      //and the multipler selection modifier is pressed
      if (form!.parentElement!.getAttribute('draggable') && hasModifier(e)) {
        //if the item's grabbed state is currently true
        if (form!.parentElement!.getAttribute('aria-grabbed') === 'true') {
          //unselect this item
          removeSelection(form!);

          //if that was the only selected item
          //then reset the owner container reference
          if (!selections.items.length) {
            selections.owner = null;
          }
        }

        //else [if the item's grabbed state is false]
        else {
          //add this additional selection
          addSelection(form!);
          console.log('adding', form, selections)
        }
      }
  }

  }, false);

  //dragstart event to initiate mouse dragging
  _.addEventListener('dragstart', function (e) {
    if (e.target !instanceof HTMLElement) {
      const form = e.target.querySelector('form');
      //if the element's parent is not the owner, then block this event
      if (selections.owner !== getContainerForm(e.target)) {
        e.preventDefault();
        return;
      }

      //[else] if the multiple selection modifier is pressed 
      //and the item's grabbed state is currently false
      if
        (
        hasModifier(e)
        &&
        e.target.getAttribute('aria-grabbed') === 'false'
      ) {
        //add this additional selection
        addSelection(form!);
      }

      //we don't need the transfer data, but we have to define something
      //otherwise the drop action won't work at all in firefox
      //most browsers support the proper mime-type syntax, eg. "text/plain"
      //but we have to use this incorrect syntax for the benefit of IE10+
      e.dataTransfer!.setData('text', '');

      //apply dropeffect to the target containers
      addDropeffects();
    }
  }, false);

  // TODO decide keyboard behaviour. tree files and folder can also be opened and renamed not only moved
  //keydown event to implement selection and abort

  let lastIndex = -1;
  const filesVisible = [];
  
  _.addEventListener('keydown', function (e) {
    //if the element is a grabbable item 
    if ( e.target! instanceof HTMLElement) {
      const form = getContainerForm(document.activeElement);
      refreshElements();
      // check if we are focused on the main root
      if (form!.dataset.root) {
        //if the multiple selection modifier is pressed 
        if (!hasModifier(e)) {
          //clear all existing selections
          clearSelections();
        }

        if (e.key === 'ArrowDown' ) {
          console.log('moving down', lastIndex)
          lastIndex++;
        } else if (e.key === 'ArrowUp') {
          console.log('moving up', lastIndex)
          lastIndex--;
        } else if (e.key === 'ArrowRight') {
          console.log('opening', lastIndex)
          const d = e.target.children[lastIndex].querySelector('details');
          d?.setAttribute('open', '');
        } else if (e.key === 'ArrowLeft') {
          console.log('closing', lastIndex)
          const d = e.target.children[lastIndex].querySelector('details');
          d?.removeAttribute('open');
        }
        const f = e.target.children[lastIndex].querySelector('form');
        addSelection(f!);
      }


      //Tab is the selection or unselection keystroke
      // if (e.key === 'Tab') {
      //   //if the multiple selection modifier is pressed 
      //   if (hasModifier(e)) {
      //     //if the item's grabbed state is currently true
      //     if (form!.parentElement!.getAttribute('aria-grabbed') === 'true') {
      //       //if this is the only selected item, clear dropeffect 
      //       //from the target containers, which we must do first
      //       //in case subsequent unselection sets owner to null
      //       if (selections.items.length == 1) {
      //         clearDropeffects();
      //       }

      //       //unselect this item
      //       removeSelection(form!);

      //       //if we have any selections
      //       //apply dropeffect to the target containers, 
      //       //in case earlier selections were made by mouse
      //       if (selections.items.length) {
      //         addDropeffects();
      //       }

      //       //if that was the only selected item
      //       //then reset the owner container reference
      //       if (!selections.items.length) {
      //         selections.owner = null;
      //       }
      //     }

      //     //else [if its grabbed state is currently false]
      //     else {
      //       //add this additional selection
      //       addSelection(form!);

      //       //apply dropeffect to the target containers    
      //       addDropeffects();
      //     }
      //   }

      //   //else [if the multiple selection modifier is not pressed]
      //   //and the item's grabbed state is currently false
      //   else if (form!.parentElement!.getAttribute('aria-grabbed') === 'false') {
      //     //clear dropeffect from the target containers
      //     clearDropeffects();

      //     //clear all existing selections
      //     clearSelections();

      //     //add this new selection
      //     addSelection(form!);

      //     //apply dropeffect to the target containers
      //     addDropeffects();
      //   }

      //   //else [if modifier is not pressed and grabbed is already true]
      //   else {
      //     //apply dropeffect to the target containers    
      //     addDropeffects();
      //   }

      //   //then prevent default to avoid any conflict with native actions
      //   // e.preventDefault();
      // }

      //Modifier + M is the end-of-selection keystroke
      // if (e.key === 'm' && hasModifier(e)) {
      //   //if we have any selected items
      //   if (selections.items.length) {
      //     //apply dropeffect to the target containers    
      //     //in case earlier selections were made by mouse
      //     addDropeffects();

      //     //if the owner container is the last one, focus the first one
      //     if (selections.owner == targets[targets.length - 1]) {
      //       targets[0].focus();
      //     }

      //     //else [if it's not the last one], find and focus the next one
      //     else {
      //       for (var len = targets.length, i = 0; i < len; i++) {
      //         if (selections.owner == targets[i]) {
      //           targets[i + 1].focus();
      //           break;
      //         }
      //       }
      //     }
      //   }

      //   //then prevent default to avoid any conflict with native actions
      //   e.preventDefault();
      // }
    }

    //Escape is the abort keystroke (for any target element)
    if (e.key === 'Escape') {
      //if we have any selected items
      if (selections.items.length) {
        //clear dropeffect from the target containers
        clearDropeffects();

        //then set focus back on the last item that was selected, which is 
        //necessary because we've removed tabindex from the current focus
        // selections.items[selections.items.length - 1].focus();

        //clear all existing selections
        clearSelections();

        //but don't prevent default so that native actions can still occur
      }
    }

  }, false);

  //related variable is needed to maintain a reference to the 
  //dragleave's relatedTarget, since it doesn't have e.relatedTarget
  let related: HTMLElement | null = null;

  //dragenter event to set that variable
  _.addEventListener('dragenter', function (e) {
    if (e.target instanceof HTMLElement) {
      related = e.target;
    }
  }, false);

  //dragleave event to maintain target highlighting using that variable
  _.addEventListener('dragleave', function (_e) {
    //get a drop target reference from the relatedTarget
    let droptarget = getContainerForm(related)?.hasAttribute('data-drop')? getContainerForm(related) : null;
    //if the target is the owner then it's not a valid drop target
    // OR
    // if the target is the same of on the selection then it's not a valid drop target (can't move in itself)
    // OR
    // if the target is the same of the selection children then it's not a valid drop target (can't move in one of the children)
    if (
      droptarget === selections.owner
      || 
      selections.items.some( item => item === droptarget)
      ||
      selections.items.some( item => [...item.querySelectorAll('form')].some(form => form === droptarget))
      ) {
      droptarget = null;
    }
    

    //if the drop target is different from the last stored reference
    //(or we have one of those references but not the other one)
    if (droptarget !== selections.droptarget) {
      //if we have a saved reference, clear its existing dragover class
      if (selections.droptarget) {
        selections.droptarget.className =
          selections.droptarget.className.replace(/ dragover/g, '');
      }

      //apply the dragover class to the new drop target reference
      if (droptarget) {
        droptarget.className += ' dragover';
      }

      //then save that reference for next time
      selections.droptarget = droptarget;
    }

    //dragover event to allow the drag by preventing its default
    _.addEventListener('dragover', function (e) {
      //if we have any selected items, allow them to be dragged
      if (selections.items.length) {
        e.preventDefault();
      }
    }, false);

  }, false);

  //dragend event to implement items being validly dropped into targets,
  //or invalidly dropped elsewhere, and to clean-up the interface either way
  _.addEventListener('dragend', function (e) {
    //if we have a valid drop target reference
    //(which implies that we have some selected items)

    if (selections.droptarget instanceof HTMLFormElement) {

      //append the selected items to the end of the target container
      for (var len = selections.items.length, i = 0; i < len; i++) {
        const key = selections.items[i]!.name.split('_')[1];
        const parentKey = selections.droptarget!.name.split('_')[1];
        tree.move(parentKey, key);
      }

      //prevent default to allow the action            
      e.preventDefault();
    }

    //if we have any selected items
    if (selections.items.length) {
      //clear dropeffect from the target containers
      clearDropeffects();

      //if we have a valid drop target reference
      if (selections.droptarget) {
        //reset the selections array
        clearSelections();

        //reset the target's dragover class
        selections.droptarget.className =
          selections.droptarget.className.replace(/ dragover/g, '');

        //reset the target reference
        selections.droptarget = null;
      }
    }

  }, false);

  //keydown event to implement items being dropped into targets
  // _.addEventListener('keydown', function (e) {
  //   //if the element is a drop target container
  //   if (e.target! instanceof HTMLElement && e.target.getAttribute('aria-dropeffect')) {
  //     //Enter or Modifier + M is the drop keystroke
  //     if (e.key === 'Enter' || (e.key === 'm' && hasModifier(e))) {
  //       //append the selected items to the end of the target container
  //       for (var len = selections.items.length, i = 0; i < len; i++) {
  //         e.target.appendChild(selections.items[i]);
  //       }

  //       //clear dropeffect from the target containers
  //       clearDropeffects();

  //       //then set focus back on the last item that was selected, which is 
  //       //necessary because we've removed tabindex from the current focus
  //       // selections.items[selections.items.length - 1].focus();

  //       //reset the selections array
  //       clearSelections();

  //       //prevent default to to avoid any conflict with native actions
  //       e.preventDefault();
  //     }
  //   }

  // }, false);

  // handle buttons for new files and folders
  const forms = document.forms as Forms;
  // TODO refactor the template behaviour in an utility function

  const fileTypeContentTemplate = ((
    document
    .getElementById('file-type-menu-list-content') as HTMLTemplateElement)!
    .content.cloneNode(true) as DocumentFragment)
    .children;

  [...fileTypeContentTemplate].forEach(article => {
    const fileTypeTemplate = ((
      document
      .getElementById('file-type-menu-list') as HTMLTemplateElement)!
      .content.cloneNode(true) as DocumentFragment)
      .firstElementChild;

      fileTypeTemplate!.querySelector('label')!.appendChild(article);
      const radio = fileTypeTemplate!.querySelector('input[type="radio"]') as HTMLInputElement;
      const form = forms['files-actions'];
      radio.value = article.getAttribute('data-type') || 'FILE_GENERIC'; 
      radio!.onchange = form!.onsubmit = ({ target } : Event) =>  {
        
        const type = Object.fromEntries(new FormData(form) as any)['file-type'];
        if (type) {
          tree.insert(form!.elements['selected-cache'].value || tree.root.key, uuidv4(), {type: type, title: ''});
          forms['files-actions'].elements['show-file-type-menu'].checked = false;
          if (target instanceof HTMLInputElement) {
            target!.checked = false;
          }
        }

      };
      
      form.elements['file-type-menu'].querySelector('menu').appendChild(fileTypeTemplate);
  });

  forms['files-actions'].addEventListener('submit', ({submitter: {name}}: {submitter: HTMLFormElement}) => {
    let parentKey: number | string = tree.root.key; // root

    if(selections.items.length) {
      const item = selections.items.reverse().find(item => item.getAttribute('data-drop'));
      console.log(item)
      item?.querySelector('details')!.setAttribute('open', '');
      parentKey = item ? item.name.split('_')[1] : parentKey;
    }
    if (name === 'new-file') {
      forms['files-actions'].elements['show-file-type-menu'].checked = true;
      forms['files-actions'].elements['selected-cache'].value = parentKey;
    } else if (name === 'new-folder') {
      tree.insert(parentKey, self.crypto.randomUUID(), {type: 'FOLDER', title: ''});
    }
  });

}
