/**
 * BlockRangeDelete.js
 *
 * Released under LGPL License.
 * Copyright (c) 1999-2017 Ephox Corp. All rights reserved
 *
 * License: http://www.tinymce.com/license
 * Contributing: http://www.tinymce.com/contributing
 */

import { Fun } from '@ephox/katamari';
import { Options } from '@ephox/katamari';
import { Compare } from '@ephox/sugar';
import { Element } from '@ephox/sugar';
import { PredicateFind } from '@ephox/sugar';
import CaretFinder from '../caret/CaretFinder';
import CaretPosition from '../caret/CaretPosition';
import DeleteUtils from './DeleteUtils';
import MergeBlocks from './MergeBlocks';
import ElementType from '../dom/ElementType';

var deleteRangeMergeBlocks = function (rootNode, selection) {
  var rng = selection.getRng();

  return Options.liftN([
    DeleteUtils.getParentBlock(rootNode, Element.fromDom(rng.startContainer)),
    DeleteUtils.getParentBlock(rootNode, Element.fromDom(rng.endContainer))
  ], function (block1, block2) {
    if (Compare.eq(block1, block2) === false) {
      rng.deleteContents();

      MergeBlocks.mergeBlocks(rootNode, true, block1, block2).each(function (pos) {
        selection.setRng(pos.toRange());
      });

      return true;
    } else {
      return false;
    }
  }).getOr(false);
};

var isRawNodeInTable = function (root, rawNode) {
  var node = Element.fromDom(rawNode);
  var isRoot = Fun.curry(Compare.eq, root);
  return PredicateFind.ancestor(node, ElementType.isTableCell, isRoot).isSome();
};

var isSelectionInTable = function (root, rng) {
  return isRawNodeInTable(root, rng.startContainer) || isRawNodeInTable(root, rng.endContainer);
};

var isEverythingSelected = function (root, rng) {
  var noPrevious = CaretFinder.prevPosition(root.dom(), CaretPosition.fromRangeStart(rng)).isNone();
  var noNext = CaretFinder.nextPosition(root.dom(), CaretPosition.fromRangeEnd(rng)).isNone();
  return !isSelectionInTable(root, rng) && noPrevious && noNext;
};

var emptyEditor = function (editor) {
  editor.setContent('');
  editor.selection.setCursorLocation();
  return true;
};

var deleteRange = function (editor) {
  var rootNode = Element.fromDom(editor.getBody());
  var rng = editor.selection.getRng();
  return isEverythingSelected(rootNode, rng) ? emptyEditor(editor) : deleteRangeMergeBlocks(rootNode, editor.selection);
};

var backspaceDelete = function (editor, forward) {
  return editor.selection.isCollapsed() ? false : deleteRange(editor);
};

export default <any> {
  backspaceDelete: backspaceDelete
};