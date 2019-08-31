import { ContainerEngine } from './container-engine';
import { METADATA_KEY } from './metadata-keys';
import { Provider } from './provider';
import { Scope } from './scope';
import { checkType } from './utils';

/**
 * A bind configuration for a given type in the IoC Container.
 */
export interface Config {
  /**
   * Inform a given implementation type to be used when a dependency for the source type is requested.
   * @param target The implementation type
   */
  to(target: Object): this;

  /**
   * Inform a provider to be used to create instances when a dependency for the source type is requested.
   * @param provider The provider to create instances
   */
  provider(provider: Provider): this;

  /**
   * Inform a scope to handle the instances for objects created by the Container for this binding.
   * @param scope Scope to handle instances
   */
  scope(scope: Scope): this;

  /**
   * Inform the types to be retrieved from IoC Container and passed to the type constructor.
   * @param paramTypes A list with parameter types.
   */
  withParams(...paramTypes: any[]): this;
}

export class ConfigImpl implements Config {
  iocprovider: Provider;
  private targetSource: Function;
  private iocscope: Scope;
  private paramTypes: any[];

  constructor(private source: Function, private engine: ContainerEngine) {}

  toSelf(): this {
    return this.to(this.source as FunctionConstructor);
  }

  to(target: FunctionConstructor): this {
    checkType(target);
    this.targetSource = target;
    if (this.source === this.targetSource) {
      const configImpl = this;
      this.iocprovider = {
        get: () => {
          const params = configImpl.getParameters();

          return new target(...params);
        }
      };
    } else {
      this.iocprovider = {
        get: () => {
          return this.engine.get(target);
        }
      };
    }
    if (this.iocscope) {
      this.iocscope.reset(this.source);
    }
    return this;
  }

  private getParameters(): any[] {
    const paramTypes: any[] = this.paramTypes || Reflect.getMetadata(METADATA_KEY.PARAM_TYPES, this.targetSource) || [];

    return paramTypes.map(paramType => this.engine.get(paramType));
  }

  provider(provider: Provider): this {
    this.iocprovider = provider;
    if (this.iocscope) {
      this.iocscope.reset(this.source);
    }
    return this;
  }

  scope(scope: Scope): this {
    this.iocscope = scope;
    if (scope === Scope.Singleton) {
      (this as any).source['__block_Instantiation'] = true;
      scope.reset(this.source);
    } else if ((this as any).source['__block_Instantiation']) {
      delete (this as any).source['__block_Instantiation'];
    }
    return this;
  }

  withParams(...paramTypes: any[]): this {
    this.paramTypes = paramTypes;
    return this;
  }

  getInstance() {
    if (!this.iocscope) {
      this.scope(Scope.Singleton);
    }
    return this.iocscope.resolve(this.iocprovider, this.source);
  }

  getType(): Function {
    return this.targetSource || this.source;
  }
}
