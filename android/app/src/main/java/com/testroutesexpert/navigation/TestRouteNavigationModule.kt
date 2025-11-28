package com.testroutesexpert.navigation

import android.app.Activity
import android.content.Intent
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule

class TestRouteNavigationModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    private var hasListeners = false

    override fun getName(): String {
        return "RNTestRouteNavigation"
    }

    @ReactMethod
    fun addListener(eventName: String) {
        hasListeners = true
    }

    @ReactMethod
    fun removeListeners(count: Int) {
        hasListeners = false
    }

    @ReactMethod
    fun startNavigation(
        origin: ReadableArray?,
        destination: ReadableArray?,
        waypoints: ReadableArray?,
        promise: Promise
    ) {
        val activity = currentActivity
        if (activity == null) {
            promise.reject("NO_ACTIVITY", "Activity doesn't exist")
            return
        }

        if (origin == null || origin.size() < 2) {
            promise.reject("INVALID_ORIGIN", "Origin coordinates are required")
            return
        }

        if (destination == null || destination.size() < 2) {
            promise.reject("INVALID_DESTINATION", "Destination coordinates are required")
            return
        }

        try {
            // Extract coordinates
            val originLng = origin.getDouble(0)
            val originLat = origin.getDouble(1)
            val destLng = destination.getDouble(0)
            val destLat = destination.getDouble(1)

            // Build waypoint list
            val waypointList = mutableListOf<Pair<Double, Double>>()
            if (waypoints != null) {
                for (i in 0 until waypoints.size()) {
                    val waypoint = waypoints.getArray(i)
                    if (waypoint != null && waypoint.size() >= 2) {
                        waypointList.add(Pair(waypoint.getDouble(0), waypoint.getDouble(1)))
                    }
                }
            }

            // Start navigation activity
            val intent = Intent(activity, TestRouteNavigationActivity::class.java)
            intent.putExtra("originLng", originLng)
            intent.putExtra("originLat", originLat)
            intent.putExtra("destLng", destLng)
            intent.putExtra("destLat", destLat)

            // Pass waypoints as arrays
            if (waypointList.isNotEmpty()) {
                val lngs = waypointList.map { it.first }.toDoubleArray()
                val lats = waypointList.map { it.second }.toDoubleArray()
                intent.putExtra("waypointLngs", lngs)
                intent.putExtra("waypointLats", lats)
            }

            activity.startActivity(intent)
            promise.resolve(Arguments.createMap().apply {
                putBoolean("success", true)
            })
        } catch (e: Exception) {
            promise.reject("START_ERROR", "Failed to start navigation: ${e.message}", e)
        }
    }

    @ReactMethod
    fun stopNavigation(promise: Promise) {
        val activity = currentActivity
        if (activity is TestRouteNavigationActivity) {
            activity.finish()
            promise.resolve(Arguments.createMap().apply {
                putBoolean("success", true)
            })
        } else {
            promise.reject("NO_NAV_ACTIVITY", "Navigation activity not found")
        }
    }

    fun sendEvent(eventName: String, params: WritableMap?) {
        if (hasListeners) {
            reactApplicationContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                .emit(eventName, params)
        }
    }
}
