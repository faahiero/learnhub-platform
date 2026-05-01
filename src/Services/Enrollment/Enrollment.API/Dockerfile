FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 80

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["src/BuildingBlocks/Common/Common.csproj", "BuildingBlocks/Common/"]
COPY ["src/Services/Enrollment/Enrollment.API/Enrollment.API.csproj", "Services/Enrollment/Enrollment.API/"]
RUN dotnet restore "Services/Enrollment/Enrollment.API/Enrollment.API.csproj"
COPY src/BuildingBlocks/ BuildingBlocks/
COPY src/Services/Enrollment/ Services/Enrollment/
WORKDIR "/src/Services/Enrollment/Enrollment.API"
RUN dotnet build "Enrollment.API.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "Enrollment.API.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENV ASPNETCORE_URLS=http://+:80
ENTRYPOINT ["dotnet", "Enrollment.API.dll"]
