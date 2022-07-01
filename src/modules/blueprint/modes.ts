export type Modes = 'pan' | 'select' | 'multi-select' | 'text-edit'

export const modes = (initMode? : Modes) => {
    const options : Record<string, Modes> = {
        PAN: 'pan',
        SELECT: 'select',
        MULTI_SELECT: 'multi-select',
        TEXT_EDIT: 'text-edit'
    }
    let currentMode = initMode || options.SELECT
    let previousMode = currentMode
    return {
      getCurrent: function() {
            return currentMode
      },
      getOptions: function() {
            return options
      },
      setCurrent: function(val : Modes) {
          if (val === currentMode) return
            previousMode = currentMode
            currentMode = val
      },
      resetPrevious: function() {
            this.setCurrent(previousMode)
      }
    }
  }
