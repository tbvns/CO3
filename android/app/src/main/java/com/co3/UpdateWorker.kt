// UpdateWorker.kt
package com.co3

import android.content.Context
import android.content.Intent
import androidx.work.Worker
import androidx.work.WorkerParameters

class UpdateWorker(context: Context, params: WorkerParameters) : Worker(context, params) {

    override fun doWork(): Result {
        // Start your custom HeadlessJsTaskService
        val intent = Intent(applicationContext, LibraryHeadlessService::class.java)
        applicationContext.startService(intent)
        return Result.success()
    }
}
