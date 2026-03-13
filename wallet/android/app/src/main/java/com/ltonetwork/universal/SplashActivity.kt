package com.ltonetwork.universal

import android.content.Intent
import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import java.util.*

class SplashActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val intent = Intent(this, MainActivity::class.java)

        val timer = Timer()
        timer.schedule(object : TimerTask() {
            override fun run() {
                // Code to execute after the delay
                startActivity(intent)
                finish()
            }
        }, 2000)

        //

        //
    }
}