
import { roundNumberTo } from '@/utilities/utilities';

interface RulerValues {
    values : Array<string>,
    spacing : number
    indent: number
}

export const generateRulerValues = (steps: number, increment: number, coordinate: number = 0, scale : number = 1) : RulerValues => {
    let rulerValues = []
    let longest = 0
    for (let index = 0; index < steps; index++) {
        const val = Math.round((-coordinate / scale) + index * increment)
        const length = val.toString().length
        longest = longest < length ? length : longest
        rulerValues.push(roundNumberTo(val, increment))
    }
    return  {
        values: resolveRulersValuesToString(rulerValues, longest),
        spacing: longest + 1,
        indent: longest / 2
    }
}
const resolveRulersValuesToString = (array: Array<number>, longest: number = 0) => {
    let valuesStrings : Array<string> = []
    for (let index = 0; index < array.length; index++) {
        const length = array[index].toString().length
        let value = array[index].toString()
        for (let j = length; j < longest; j++) {
            if (j % 2 === 0 ) {
                value = value + ' '
            } else {
                value = ' ' + value
            }     
        }
        valuesStrings.push(value)
    }
    return valuesStrings
}
