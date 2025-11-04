FROM eclipse-temurin:21-jdk AS build
WORKDIR /app
COPY . .
RUN ./mvnw -q -e -DskipTests -Dquarkus.package.type=uber-jar clean package

FROM eclipse-temurin:21-jre
WORKDIR /app

ENV GOOGLE_APPLICATION_CREDENTIALS=/app/firebase-sa.json

COPY --from=build /app/target/*-runner.jar /app/app.jar

EXPOSE 8080
CMD ["java", "-jar", "/app/app.jar"]
