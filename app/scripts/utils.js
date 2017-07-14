module.exports = {
  // Returns a function, that, as long as it continues to be invoked, will not
  // be triggered. The function will be called after it stops being called for
  // N milliseconds. If `immediate` is passed, trigger the function on the
  // leading edge, instead of the trailing.
  debounce: (func, wait, immediate) => {
    let timeout;
    return () => {
      const context = this;
      const args = arguments;
      const later = () => {
        timeout = null;
        if (!immediate) func.apply(context, args);
      };
      const callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) func.apply(context, args);
    };
  },

  parseDescription: (description, searchTerm) => {
    const descriptionBits = [];
    const descArr = description.split('|');
    let n = descArr.length - 1;
    let left = '';

    if (description.toLowerCase().indexOf(searchTerm) < 0) {
      descriptionBits.push({ text: descArr[n] });
    } else {
      while (descArr[n].toLowerCase().indexOf(searchTerm) < 0) {
        n -= 1;
      }
      let idx = descArr[n].toLowerCase().indexOf(searchTerm);
      while (idx >= 0) {
        if (idx === 0) {
          descriptionBits.push({ text: descArr[n].substr(0, searchTerm.length), isSyn: true });
        } else {
          descriptionBits.push({ text: descArr[n].substr(0, idx) });
          descriptionBits.push({ text: descArr[n].substr(idx, searchTerm.length), isSyn: true });
        }
        left = descArr[n].substr(idx + searchTerm.length);
        idx = descArr[n].toLowerCase().indexOf(searchTerm, idx + searchTerm.length - 1);
      }
    }
    if (left.length > 0) {
      descriptionBits.push({ text: left });
    }
    return descriptionBits;
  },

  parseDescriptionMultipleTerms: (description, searchTerms) => {
    const descriptionBits = [];
    const descArr = description.split('|');
    let n = descArr.length - 1;
    let left = '';

    let searchTermsInDescription = searchTerms
                                        .filter(t => description.toLowerCase().indexOf(t) >= 0);

    if (searchTermsInDescription.length === 0) {
      descriptionBits.push({ text: descArr[n] });
    } else {
      while (searchTermsInDescription.filter(t => descArr[n].toLowerCase().indexOf(t) >= 0).length === 0) {
        n -= 1;
      }
      left = descArr[n];
      searchTermsInDescription = searchTerms.filter(t => left.toLowerCase().indexOf(t) >= 0);
      let firstTerm = searchTermsInDescription.map(t => ({ idx: left.toLowerCase().indexOf(t), t })).reduce((minItem, cur) => {
        if (cur.idx === -1 || cur.idx >= minItem.idx) return minItem;
        return cur;
      });
      while (firstTerm.idx >= 0) {
        if (firstTerm.idx === 0) {
          descriptionBits.push({ text: left.substr(0, firstTerm.t.length), isSyn: true });
        } else {
          descriptionBits.push({ text: left.substr(0, firstTerm.idx) });
          descriptionBits.push({ text: left.substr(firstTerm.idx, firstTerm.t.length), isSyn: true });
        }
        left = left.substr(firstTerm.idx + firstTerm.t.length);
        searchTermsInDescription = searchTerms
                                        .filter(t => left.toLowerCase().indexOf(t) >= 0);
        if (searchTermsInDescription.length === 0) break;
        firstTerm = searchTermsInDescription.map(t => ({ idx: left.toLowerCase().indexOf(t), t })).reduce((minItem, cur) => {
          if (cur.idx === -1 || cur.idx >= minItem.idx) return minItem;
          return cur;
        });
      }
    }
    if (left.length > 0) {
      descriptionBits.push({ text: left });
    }
    return descriptionBits;
  },

  parseDescriptionMultipleTermsNEW: (description, searchTerms) => {
    const descriptionBits = [];
    const descArr = description.split('|');
    let n = descArr.length - 1;

    const searchTermsInDescription = searchTerms
                                        .filter(t => description.toLowerCase().indexOf(t.toLowerCase()) >= 0);

    if (searchTermsInDescription.length === 0) {
      descriptionBits.push({ text: descArr[n] });
      return { text: descArr[n], match: false };
    }
    while (searchTermsInDescription.filter(t => descArr[n].toLowerCase().indexOf(t.toLowerCase()) >= 0).length === 0) {
      n -= 1;
    }
    return { text: descArr[n], match: true };
  },

  getSelectionCoords: (win = window) => {
    const doc = win.document;
    let sel = doc.selection;
    let range;
    let rects;
    let rect;
    let x = 0;
    let y = 0;
    let right = 0;
    if (sel) {
      if (sel.type !== 'Control') {
        range = sel.createRange();
        // range.collapse(true);
        x = range.boundingLeft;
        y = range.boundingTop;
        right = x + range.boundingWidth;
      }
    } else if (win.getSelection) {
      sel = win.getSelection();
      if (sel.rangeCount) {
        range = sel.getRangeAt(0).cloneRange();
        if (range.getClientRects) {
          // range.collapse(true);
          rects = range.getClientRects();
          if (rects.length > 0) {
            rect = rects[0];
          }
          // console.log(rect);
          x = rect.left;
          y = rect.top;
          right = rect.right;
        }
            // Fall back to inserting a temporary element
        if (x === 0 && y === 0) {
          const span = doc.createElement('span');
          if (span.getClientRects) {
                    // Ensure span has dimensions and position by
                    // adding a zero-width space character
            span.appendChild(doc.createTextNode('\u200b'));
            range.insertNode(span);
            rect = span.getClientRects()[0];
            x = rect.left;
            y = rect.top;
            right = rect.right;
            const spanParent = span.parentNode;
            spanParent.removeChild(span);

                    // Glue any broken text nodes back together
            spanParent.normalize();
          }
        }
      }
    }
    return { x, y, right };
  },

  getCodeForTerminology: (code, terminology) => {
    if (terminology === 'Readv2') {
      return code.substr(0, 5);
    }
    return code;
  },
};
