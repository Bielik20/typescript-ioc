import * as assert from 'assert';
import * as chai from 'chai';
import 'mocha';
import 'reflect-metadata';
import { Container } from '../../src/container';
import { Injectable } from '../../src/decorators';
import { Scope } from '../../src/scope';

const container = new Container();
const expect = chai.expect;


describe('@Inject annotation on Constructor parameter', () => {
  const constructorsArgs: any[] = new Array<any>();
  const constructorsMultipleArgs: any[] = new Array<any>();

  @Injectable()
  class TestConstructor {
    injectedDate: Date;

    constructor(date: Date) {
      constructorsArgs.push(date);
      this.injectedDate = date;
    }
  }

  @Injectable()
  class TestConstructor2 {
    constructor(public teste1?: TestConstructor) {}
  }

  it('should not inject a new value as argument on cosntrutor call, when parameter is not provided', () => {
    const instance: TestConstructor2 = new TestConstructor2();
    expect(instance.teste1).to.not.exist;
  });

  it('should not inject a new value as argument on cosntrutor call, when parameter is provided', () => {
    const myDate: Date = new Date(1);
    const instance: TestConstructor = new TestConstructor(myDate);
    expect(instance.injectedDate).to.equals(myDate);
  });

  @Injectable()
  class Aaaa {}

  @Injectable()
  class Bbbb {}

  @Injectable()
  class Cccc {}

  @Injectable()
  class Dddd {
    constructor(a: Aaaa, b: Bbbb, c: Cccc) {
      constructorsMultipleArgs.push(a);
      constructorsMultipleArgs.push(b);
      constructorsMultipleArgs.push(c);
    }
  }

  it('should inject multiple arguments on construtor call in correct order', () => {
    const instance: Dddd = container.get(Dddd);
    expect(instance).to.exist;
    expect(constructorsMultipleArgs[0]).to.exist;
    expect(constructorsMultipleArgs[1]).to.exist;
    expect(constructorsMultipleArgs[2]).to.exist;
    expect(constructorsMultipleArgs[0].constructor).to.equals(Aaaa);
    expect(constructorsMultipleArgs[1].constructor).to.equals(Bbbb);
    expect(constructorsMultipleArgs[2].constructor).to.equals(Cccc);
  });
});

describe('Default Implementation class', () => {
  class BaseClass {
  }

  @Injectable()
  class ImplementationClass implements BaseClass {
    constructor(public testProp: Date) {}
  }

  it('should inform Container that it is the implementation for its base type', () => {
    container.bind(BaseClass).to(ImplementationClass);
    const instance: ImplementationClass = container.get(BaseClass) as ImplementationClass;
    const test = instance['testProp'];
    expect(test).to.exist;
  });
});

describe('The IoC container.bind(source)', () => {

  @Injectable()
  class ContainerInjectTest {
    constructor(public dateProperty?: Date) {}
  }

  container.bind(ContainerInjectTest);

  it('should inject internal fields of non AutoWired classes, if it is requested to the Container', () => {
    const instance: ContainerInjectTest = container.get(ContainerInjectTest);
    expect(instance.dateProperty).to.exist;
  });

  it('should not inject internal fields of non AutoWired classes, if it is created by its constructor', () => {
    const instance: ContainerInjectTest = new ContainerInjectTest();
    expect(instance.dateProperty).to.not.exist;
  });
});

describe('The IoC container.get(source)', () => {

  @Injectable()
  class ContainerInjectConstructorTest {
    injectedDate: Date;

    constructor(date: Date) {
      this.injectedDate = date;
    }
  }

  container.bind(ContainerInjectConstructorTest);

  it('should inject internal fields of non AutoWired classes, if it is requested to the Container', () => {
    const instance: ContainerInjectConstructorTest = container.get(ContainerInjectConstructorTest);
    expect(instance.injectedDate).to.exist;
  });
});

describe('The IoC container.getType(source)', () => {

  @Injectable()
  abstract class ITest {
    abstract testValue: string;
  }

  @Injectable()
  class Test implements ITest {
    testValue = 'success';
  }

  @Injectable()
  class TestNoProvider {
    testValue = 'success';
  }

  @Injectable()
  class TypeNotRegistered {
    testValue = 'success';
  }

  container.bind(ITest).to(Test);
  container.bind(TestNoProvider);

  it('should retrieve type used by the Container', () => {
    const clazz: Function = container.getType(ITest);
    expect(clazz).to.be.equal(Test);

    const clazzNoProvider: Function = container.getType(TestNoProvider);
    expect(clazzNoProvider).to.be.equal(TestNoProvider);
  });

  it('should throw error when the type is not registered in the Container', () => {
    try {
      const clazz: Function = container.getType(TypeNotRegistered);
      assert.fail(clazz, null, `The type TypeNotResistered should not pass the test`);
    } catch (e) {
      expect(e).instanceOf(TypeError);
    }
  });

});

describe('The IoC Container', () => {

  class SingletonInstantiation {
  }

  class ContainerSingletonInstantiation {
  }

  container.bind(ContainerSingletonInstantiation)
    .to(ContainerSingletonInstantiation)
    .scope(Scope.Singleton);

  it('should allow Container instantiation of Singleton classes.', () => {
    const instance: SingletonInstantiation = container.get(SingletonInstantiation);
    expect(instance).to.exist;
  });

  it('should allow scope change to Transient from Singleton.', () => {
    const instance: SingletonInstantiation = container.get(SingletonInstantiation);
    expect(instance).to.exist;
    container.bind(SingletonInstantiation).scope(Scope.Transient);
    const instance2: SingletonInstantiation = new SingletonInstantiation();
    expect(instance2).to.exist;
  });
});

describe('The IoC Container Binding.to()', () => {

  abstract class FirstClass {
    abstract getValue(): string;
  }

  class SecondClass extends FirstClass {
    getValue(): string {
      return 'second';
    }
  }

  class ThirdClass extends FirstClass {
    getValue(): string {
      return 'third';
    }
  }

  container.bind(FirstClass).to(SecondClass);

  it('should allow target overriding', () => {
    let instance: FirstClass = container.get(FirstClass);
    expect(instance.getValue()).to.equal('second');

    container.bind(FirstClass).to(ThirdClass);
    instance = container.get(FirstClass);
    expect(instance.getValue()).to.equal('third');
  });
});
