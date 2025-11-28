package com.testroutesexpert.navigation

import android.os.Bundle
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity

/**
 * Native navigation activity stub
 * Actual navigation is handled by @pawan-pk/react-native-mapbox-navigation
 */
class TestRouteNavigationActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // Navigation is handled through React Native via the Mapbox Navigation library
        Toast.makeText(this, "Navigation starting...", Toast.LENGTH_SHORT).show()
        
        // This activity is a stub - navigation happens in React Native
        finish()
    }
}
