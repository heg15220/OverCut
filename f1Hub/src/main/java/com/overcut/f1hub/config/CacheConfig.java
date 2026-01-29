package com.overcut.f1hub.config;

import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.concurrent.ConcurrentMapCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableCaching
public class CacheConfig {

    @Bean
    public CacheManager cacheManager() {
        // Simple y muy eficaz para JMeter (memoria).
        // Si luego quieres TTL, cámbialo a Caffeine.
        return new ConcurrentMapCacheManager(
                "driverBreakdown",
                "teamGapSeason"
        );
    }
}
