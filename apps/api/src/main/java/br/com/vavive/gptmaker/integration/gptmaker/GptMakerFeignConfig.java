package br.com.vavive.gptmaker.integration.gptmaker;

import feign.RequestInterceptor;
import feign.RequestTemplate;
import org.springframework.context.annotation.Bean;

public class GptMakerFeignConfig {
    @Bean
    RequestInterceptor gptMakerRequestInterceptor(GptMakerProperties properties) {
        return new RequestInterceptor() {
            @Override
            public void apply(RequestTemplate template) {
                template.header("Accept", "application/json");
                template.header("Content-Type", "application/json");
                if (properties.tokenConfigured()) {
                    template.header("Authorization", "Bearer " + properties.sanitizedApiToken());
                }
            }
        };
    }
}
