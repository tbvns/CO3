package com.co3

import androidx.work.*
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import java.util.concurrent.TimeUnit

class LibrarySchedulerModule(private val reactContext: ReactApplicationContext)
    : ReactContextBaseJavaModule(reactContext) {

    override fun getName() = "LibraryScheduler"

    @ReactMethod
    fun schedule(intervalMinutes: Int, networkType: String) {
        val networkConstraint = when (networkType.uppercase()) {
            "NONE" -> NetworkType.NOT_REQUIRED
            "CONNECTED" -> NetworkType.CONNECTED
            "UNMETERED" -> NetworkType.UNMETERED
            "NOT_ROAMING" -> NetworkType.NOT_ROAMING
            else -> NetworkType.NOT_REQUIRED
        }

        val constraints = Constraints.Builder()
            .setRequiredNetworkType(networkConstraint)
            .build()

        val workRequest = PeriodicWorkRequestBuilder<UpdateWorker>(
            intervalMinutes.toLong(), TimeUnit.MINUTES
        )
            .setConstraints(constraints)
            .build()

        WorkManager.getInstance(reactContext).enqueueUniquePeriodicWork(
            "LibraryUpdateWork",
            ExistingPeriodicWorkPolicy.KEEP,
            workRequest
        )
    }

    @ReactMethod
    fun cancel() {
        WorkManager.getInstance(reactContext).cancelUniqueWork("LibraryUpdateWork")
    }
}
