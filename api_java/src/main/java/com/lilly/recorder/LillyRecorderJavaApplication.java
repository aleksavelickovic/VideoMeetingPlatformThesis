package com.lilly.recorder;

import com.lilly.recorder.config.SystemConfigurationProperties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
@EnableConfigurationProperties(SystemConfigurationProperties.class)
public class LillyRecorderJavaApplication {

    public static void main(String[] args) {
        SpringApplication.run(LillyRecorderJavaApplication.class, args);
    }
}
