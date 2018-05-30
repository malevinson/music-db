export const WORDS_ALWAYS_LOWERCASE = [
    'at',
    'by',
    'down',
    'for',
    'from',
    'in',
    'into',
    'like',
    'near',
    'of',
    'off',
    'on',
    'onto',
    'over',
    'past',
    'to',
    'upon',
    'with',
    'and',
    'as',
    'but',
    'for',
    'if',
    'nor',
    'once',
    'or',
    'so',
    'than',
    'that',
    'till',
    'when',
    'yet'
];

export const toTitleCase = str => {
    return str.replace(/\w\S*/g, function(txt) {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
};

export const titleCaseString = inputString => {
    let inputArray = inputString.split(' ');
    let outputString = '';
    let temp = '';

    inputArray.forEach((word, i) => {
        if (i > 0) temp = ' ';
        if (i > 0 && WORDS_ALWAYS_LOWERCASE.indexOf(word.toLowerCase()) > -1) {
            temp += word;
        } else {
            temp += toTitleCase(word);
        }
        outputString += temp;
    });
    return outputString;
};
