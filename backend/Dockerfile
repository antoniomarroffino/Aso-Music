ARG APP_VERSION=0.0.0-development
ARG GIT_REVISION=unknown

FROM maven:3.9.9-eclipse-temurin-21 AS build
WORKDIR /workspace
COPY . .
RUN mvn package

FROM gcr.io/distroless/java21-debian12:nonroot
ARG APP_VERSION
ARG GIT_REVISION
WORKDIR /app
COPY --from=build /workspace/target/quarkus-app/lib/ /app/lib/
COPY --from=build /workspace/target/quarkus-app/*.jar /app/
COPY --from=build /workspace/target/quarkus-app/app/ /app/app/
COPY --from=build /workspace/target/quarkus-app/quarkus/ /app/quarkus/

LABEL org.opencontainers.image.title="ASO Music backend" \
      org.opencontainers.image.version="${APP_VERSION}" \
      org.opencontainers.image.revision="${GIT_REVISION}"

ENV APP_VERSION="${APP_VERSION}" \
    QUARKUS_APPLICATION_VERSION="${APP_VERSION}" \
    JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=60 -Xms32m -Xmx256m \
 -XX:+UseSerialGC -XX:+TieredCompilation -XX:TieredStopAtLevel=1 \
 -Dquarkus.http.host=0.0.0.0 -Dquarkus.http.port=8080"
EXPOSE 8080
USER nonroot:nonroot
ENTRYPOINT ["java","-jar","/app/quarkus-run.jar"]
