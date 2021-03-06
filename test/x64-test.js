var assert = require('assert');
var fixtures = require('./fixtures');
var testAsm = fixtures.testAsm;

describe('wasm Compiler/x64', function() {
  it('should compile empty function', function() {
    testAsm(function() {/*
      void main() {
      }
    */}, function() {/*
      push rbp
      mov rbp, rsp
      mov rsp, rbp
      pop rbp
      ret
    */});
  });

  describe('params', function() {
    it('should compile i64 params', function() {
      testAsm(function() {/*
        i64 main(i64 a, i64 b) {
          return i64.add(a, b);
        }
      */}, function() {/*
        push rbp
        mov rbp, rsp
        mov rax, rdi
        add rax, rsi
        mov rsp, rbp
        pop rbp
        ret
      */});
    });

    it('should compile i32 params', function() {
      testAsm(function() {/*
        i32 main(i32 a) {
          return a;
        }
      */}, function() {/*
        push rbp
        mov rbp, rsp
        mov rax, rdi
        mov rsp, rbp
        pop rbp
        ret
      */});
    });

    it('should compile i16 params', function() {
      testAsm(function() {/*
        i16 main(i16 a) {
          return a;
        }
      */}, function() {/*
        push rbp
        mov rbp, rsp
        mov rax, rdi
        mov rsp, rbp
        pop rbp
        ret
      */});
    });

    it('should compile i8 params', function() {
      testAsm(function() {/*
        i8 main(i8 a) {
          return a;
        }
      */}, function() {/*
        push rbp
        mov rbp, rsp
        mov rax, rdi
        mov rsp, rbp
        pop rbp
        ret
      */});
    });

    it('should compile many params', function() {
      var code = 'i64 main(';
      var count = 9;

      var params = [];
      for (var i = 0; i < count; i++)
        params.push('i64 pi' + i + ', f64 pf' + i);

      code += params.join(', ') + ') {\n';
      code += 'i64 ti = i64.const(0);\n';
      code += 'f64 tf = f64.const(0);\n';
      for (var i = 0; i < count; i++) {
        code += 'ti = i64.add(ti, pi' + i + ');\n';
        code += 'tf = f64.add(tf, pf' + i + ');\n';
      }
      for (var i = 0; i < count; i++) {
        code += 'ti = i64.add(ti, pi' + i + ');\n';
        code += 'tf = f64.add(tf, pf' + i + ');\n';
      }
      code += 'ti = i64.add(ti, i64.trunc_s_64(tf));\n';
      code += 'return ti;\n';
      code += '}';

      testAsm(code, function() {/*
        push rbp
        mov rbp, rsp
        mov rax, 0x0
        add rax, rdi
        add rax, rsi
        add rax, rdx
        add rax, rcx
        add rax, r8
        add rax, r9
        mov rbx, [rbp, 0x10]
        add rax, rbx
        mov rbx, [rbp, 0x18]
        add rax, rbx
        mov rbx, [rbp, 0x20]
        add rax, rbx
        add rax, rdi
        add rax, rsi
        add rax, rdx
        add rax, rcx
        add rax, r8
        add rax, r9
        mov rbx, [rbp, 0x10]
        add rax, rbx
        mov rbx, [rbp, 0x18]
        add rax, rbx
        mov rbx, [rbp, 0x20]
        add rax, rbx
        mov r15, 0x0000000000000000
        vmovq xmm8, r15
        vaddsd xmm8, xmm0
        vaddsd xmm8, xmm1
        vaddsd xmm8, xmm2
        vaddsd xmm8, xmm3
        vaddsd xmm8, xmm4
        vaddsd xmm8, xmm5
        vaddsd xmm8, xmm6
        vaddsd xmm8, xmm7
        vmovq xmm9, [rbp, 0x28]
        vaddsd xmm8, xmm9
        vaddsd xmm0, xmm8
        vaddsd xmm0, xmm1
        vaddsd xmm0, xmm2
        vaddsd xmm0, xmm3
        vaddsd xmm0, xmm4
        vaddsd xmm0, xmm5
        vaddsd xmm0, xmm6
        vaddsd xmm0, xmm7
        vmovq xmm1, [rbp, 0x28]
        vaddsd xmm0, xmm1
        vcvttsd2si rbx, xmm0
        add rax, rbx
        mov rsp, rbp
        pop rbp
        ret
      */});
    });
  });

  it('should compile chain of expression', function() {
    testAsm(function() {/*
      i64 main(i64 a, i64 b) {
        return i64.add(a, i64.add(b, i64.const(1358)));
      }
    */}, function() {/*
      push rbp
      mov rbp, rsp
      mov rax, 0x54e
      add rax, rsi
      add rax, rdi
      mov rsp, rbp
      pop rbp
      ret
    */});
  });

  it('should work for floating point', function() {
    testAsm(function() {/*
      f64 main(f64 a) {
        return f64.add(a, f64.const(123.456));
      }
    */}, function() {/*
      push rbp
      mov rbp, rsp
      mov r15, 0x405edd2f1a9fbe77
      vmovq xmm1, r15
      vaddsd xmm0, xmm1
      mov rsp, rbp
      pop rbp
      ret
    */});
  });

  it('should work with local variables', function() {
    testAsm(function() {/*
      f64 main(f64 a) {
        f64 b = f64.const(123.456);
        return f64.add(a, b);
      }
    */}, function() {/*
      push rbp
      mov rbp, rsp
      mov r15, 0x405edd2f1a9fbe77
      vmovq xmm1, r15
      vaddsd xmm0, xmm1
      mov rsp, rbp
      pop rbp
      ret
    */});
  });

  it('should work with branches', function() {
    testAsm(function() {/*
      i64 main(i64 a) {
        if (a) {
          return a;
        }
        return i64.const(1);
      }
    */}, function() {/*
      push rbp
      mov rbp, rsp
      test edi, 0x0
      far-jcc z, 0x9

      mov rax, rdi
      mov rsp, rbp
      pop rbp
      ret

      mov rax, 0x1
      mov rsp, rbp
      pop rbp
      ret
    */});
  });

  it('should compile forever loop', function() {
    testAsm(function() {/*
      i64 main() {
        i64 t = i64.const(0);
        forever {
           t = i64.add(t, i64.const(1));
        }
        return t;
      }
    */}, function() {/*
      push rbp
      mov rbp, rsp
      mov rax, 0x0
      mov rbx, 0x1
      add rax, rbx
      jmp -0x8
      mov rsp, rbp
      pop rbp
      ret
    */});
  });

  it('should compile forever loop with break/continue', function() {
    testAsm(function() {/*
      i64 main() {
        i64 t = i64.const(0);
        forever {
           t = i64.add(t, i64.const(1));
           if (t)
             continue;
           else
             break;
        }
        return t;
      }
    */}, function() {/*
      push rbp
      mov rbp, rsp
      mov rax, 0x0
      mov rbx, 0x1
      add rax, rbx
      test al, 0x0
      far-jcc z, 0x5
      jmp -0x10
      mov rsp, rbp
      pop rbp
      ret
    */});
  });

  it('should compile do {} while loop', function() {
    testAsm(function() {/*
      i64 main() {
        i64 t = i64.const(10);
        do {
          t = i64.add(t, i64.const(-1));
        } while (t);
        return t;
      }
    */}, function() {/*
      push rbp
      mov rbp, rsp
      mov rax, 0xa
      mov rbx, -0x1
      add rax, rbx
      test al, 0x0
      far-jcc z, 0x5
      jmp -0x10
      mov rsp, rbp
      pop rbp
      ret
    */});
  });

  it('should compile memory stores/loads', function() {
    testAsm(function() {/*
      i64 main() {
        i64 t = i64.const(0);
        i64.store(addr.from_i64(t), i64.const(0xdead));
        i64 l = i64.load(addr.from_i64(t));
        return l;
      }
    */}, function() {/*
      push rbp
      mov rbp, rsp

      mov rax, [r14, 0x0]
      mov rbx, 0x0
      mov rcx, [r14, 0x8]

      lea r15, [rbx, 0x8]
      cmp r15, rcx
      jcc le, 0x5
      xor rdx, rdx
      jmp 0x3
      mov rdx, rbx
      mov rdi, 0xdead
      mov [rax, rdx, 0x0], rdi

      lea r15, [rbx, 0x8]
      cmp r15, rcx
      jcc le, 0x3
      xor rbx, rbx
      mov rax, [rax, rbx, 0x0]

      mov rsp, rbp
      pop rbp
      ret
    */});
  });

  it('should compile calls', function() {
    testAsm(function() {/*
      i64 main() {
        i64 t = i64.const(123);
        return add(t, i64.const(456), t);
      }

      i64 add(i64 a, i64 b, i64 c) {
        return i64.add(a, b);
      }
    */}, function() {/*
      push rbp
      mov rbp, rsp
      mov rdi, 0x7b
      mov rsi, 0x1c8
      mov rdx, rdi
      lea rax, [rip, 0x13]
      call eax
      mov rsp, rbp
      pop rbp
      ret

      int3
      int3
      int3
      int3
      int3
      int3
      int3
      int3
      int3
      int3
      int3

      push rbp
      mov rbp, rsp
      mov rax, rdi
      add rax, rsi
      mov rsp, rbp
      pop rbp
      ret
    */});
  });
});
