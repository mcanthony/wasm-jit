'use strict';

var assert = require('assert');
var util = require('util');
var Reducer = require('json-pipeline-reducer');

function SelectX64Opcode() {
  Reducer.Reduction.call(this);

  this.memory = {
    space: null,
    size: null
  };
}
util.inherits(SelectX64Opcode, Reducer.Reduction);
module.exports = SelectX64Opcode;

SelectX64Opcode.prototype.start = function start(reducer) {
  this.memory.space = reducer.graph.create('x64:memory.space');
  this.memory.size = reducer.graph.create('x64:memory.size');
  reducer.add(this.memory.space);
  reducer.add(this.memory.size);
};

SelectX64Opcode.prototype.end = function end() {
  this.memory.space = null;
  this.memory.size = null;
};

SelectX64Opcode.prototype.reduce = function reduce(node, reducer) {
  // Already replaced
  if (/^x64:/.test(node.opcode))
    return;

  if (/\.bool$/.test(node.opcode))
    return this.reduceBool(node, reducer);

  if (/\.ret$/.test(node.opcode))
    return this.reduceRet(node, reducer);

  if (/\.load/.test(node.opcode) || /\.store/.test(node.opcode))
    return this.reduceMemoryAccess(node, reducer);

  if (/^addr\.from_/.test(node.opcode))
    return this.reduceMemoryCoercion(node, reducer);
};

SelectX64Opcode.prototype.reduceBool = function reduceBool(node, reducer) {
  if (/^f/.test(node.opcode))
    return;

  // Just replace with the input, we are ready to handle 64bit integers!
  if ('i64.bool')
    reducer.replace(node, node.inputs[0]);
};

SelectX64Opcode.prototype.reduceRet = function reduceRet(node, reducer) {
  if (node.opcode === 'f32.ret' || node.opcode === 'f64.ret')
    node.opcode = 'x64:float.ret';
  else
    node.opcode = 'x64:int.ret';
  reducer.change(node);
};

SelectX64Opcode.prototype.reduceMemoryAccess = function reduceMemoryAccess(
    node, reducer) {
  // Prepend input to load/store

  var opcode = node.opcode;

  // Generalize opcode
  var size;
  if (opcode === 'i64.store8' || opcode === 'i32.store8') {
    opcode = 'int.store8';
    size = 8;
  } else if (opcode === 'i64.store16' || opcode === 'i32.store16') {
    opcode = 'int.store16';
    size = 16;
  } else if (opcode === 'i32.load8_u' || opcode === 'i64.load8_u') {
    opcode = 'int.load8_u';
    size = 8;
  } else if (opcode === 'i32.load8_s' || opcode === 'i64.load8_s') {
    opcode = 'int.load8_s';
    size = 8;
  } else if (opcode === 'i32.load16_u' || opcode === 'i64.load16_u') {
    opcode = 'int.load16_u';
    size = 16;
  } else if (opcode === 'i32.load16_s' || opcode === 'i64.load16_s') {
    opcode = 'int.load16_s';
    size = 16;
  } else if (opcode === 'i64.load32_u' || opcode === 'i64.load32_s' ||
             opcode === 'i64.store32' || opcode === 'i32.store' ||
             opcode === 'i32.load' || opcode === 'f32.load' ||
             opcode === 'f32.store') {
    size = 32;
  } else if (opcode === 'i64.load' || opcode === 'i64.store' ||
             opcode === 'f64.load' || opcode === 'f64.store') {
    size = 64;
  } else if (opcode === 'i16.load' || opcode === 'i16.store') {
    size = 16;
  } else if (opcode === 'i8.load' || opcode === 'i8.store') {
    size = 8;
  }

  assert(size, 'Unknown memory access opcode: ' + node.opcode);
  size /= 8;

  var cell = node.inputs[0];

  var access = reducer.graph.create('x64:' + opcode, this.memory.space);
  cell = reducer.graph.create('x64:memory.bounds-check', [
    cell, this.memory.size ]);
  cell.addLiteral(size);
  reducer.add(cell);

  access.addInput(cell);
  for (var i = 1; i < node.inputs.length; i++)
    access.addInput(node.inputs[i]);

  reducer.replace(node, access);
};

SelectX64Opcode.prototype.reduceMemoryCoercion = function reduceMemoryCoercion(
    node, reducer) {
  // Int64 is an address
  if (node.opcode === 'addr.from_i64') {
    reducer.replace(node, node.inputs[0]);
    return;
  }
};
