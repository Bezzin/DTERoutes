/**
 * Native Navigation Bridge
 * =========================
 * TypeScript bridge to native iOS/Android navigation modules
 * with re-routing properly disabled at the native level
 */

import { NativeModules, NativeEventEmitter, EmitterSubscription } from 'react-native';

interface NavigationModule {
  startNavigation(
    origin: [number, number],
    destination: [number, number],
    waypoints: Array<[number, number]>
  ): Promise<{ success: boolean }>;

  stopNavigation(): Promise<{ success: boolean }>;

  addListener(eventName: string): void;
  removeListeners(count: number): void;
}

const { RNTestRouteNavigation } = NativeModules;

if (!RNTestRouteNavigation) {
  throw new Error(
    'RNTestRouteNavigation native module is not available. ' +
    'Make sure the native code is properly linked.'
  );
}

const navigationModule = RNTestRouteNavigation as NavigationModule;
const eventEmitter = new NativeEventEmitter(RNTestRouteNavigation);

export interface NavigationProgress {
  distanceRemaining: number;
  durationRemaining: number;
  fractionTraveled: number;
  isOffRoute: boolean;
}

export interface OffRouteEvent {
  distanceFromRoute: number;
}

export class NativeNavigation {
  private progressListener: EmitterSubscription | null = null;
  private errorListener: EmitterSubscription | null = null;
  private cancelListener: EmitterSubscription | null = null;
  private arriveListener: EmitterSubscription | null = null;
  private offRouteListener: EmitterSubscription | null = null;

  /**
   * Start navigation with re-routing DISABLED
   */
  async startNavigation(
    origin: [number, number],
    destination: [number, number],
    waypoints: Array<[number, number]> = []
  ): Promise<void> {
    try {
      await navigationModule.startNavigation(origin, destination, waypoints);
    } catch (error) {
      throw new Error(`Failed to start navigation: ${error}`);
    }
  }

  /**
   * Stop navigation
   */
  async stopNavigation(): Promise<void> {
    try {
      await navigationModule.stopNavigation();
      this.removeAllListeners();
    } catch (error) {
      throw new Error(`Failed to stop navigation: ${error}`);
    }
  }

  /**
   * Listen for navigation progress updates
   */
  onProgress(callback: (progress: NavigationProgress) => void): void {
    this.progressListener = eventEmitter.addListener(
      'onNavigationProgress',
      callback
    );
  }

  /**
   * Listen for navigation errors
   */
  onError(callback: (error: any) => void): void {
    this.errorListener = eventEmitter.addListener(
      'onNavigationError',
      callback
    );
  }

  /**
   * Listen for navigation cancellation
   */
  onCancel(callback: () => void): void {
    this.cancelListener = eventEmitter.addListener(
      'onNavigationCancel',
      callback
    );
  }

  /**
   * Listen for arrival at destination
   */
  onArrive(callback: (data: any) => void): void {
    this.arriveListener = eventEmitter.addListener(
      'onNavigationArrive',
      callback
    );
  }

  /**
   * Listen for off-route events
   */
  onOffRoute(callback: (data: OffRouteEvent) => void): void {
    this.offRouteListener = eventEmitter.addListener(
      'onOffRoute',
      callback
    );
  }

  /**
   * Remove all event listeners
   */
  removeAllListeners(): void {
    this.progressListener?.remove();
    this.errorListener?.remove();
    this.cancelListener?.remove();
    this.arriveListener?.remove();
    this.offRouteListener?.remove();

    this.progressListener = null;
    this.errorListener = null;
    this.cancelListener = null;
    this.arriveListener = null;
    this.offRouteListener = null;
  }
}

export default new NativeNavigation();
