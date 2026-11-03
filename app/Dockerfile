FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn -q -DskipTests package

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
RUN addgroup -S app && adduser -S app -G app
USER app
COPY --from=build /app/target/product-service-0.0.1-SNAPSHOT.jar app.jar
EXPOSE 8080
ENV JAVA_TOOL_OPTIONS="-XX:+UseSerialGC -Xms48m -Xmx128m -XX:MaxMetaspaceSize=96m -XX:ReservedCodeCacheSize=32m -Xss256k -XX:+ExitOnOutOfMemoryError"
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
