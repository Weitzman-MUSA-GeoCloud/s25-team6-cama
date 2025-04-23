FROM gcr.io/google.com/cloudsdktool/cloud-sdk:slim

RUN apt-get update && \
    apt-get install -y r-base libcurl4-openssl-dev libssl-dev libxml2-dev && \
    apt-get clean

# Install GDAL for ogr2ogr
RUN apt-get install -y r-base

# Execute next commands in the directory /workspace
WORKDIR /workspace

# Copy over the script to the /workspace directory
COPY script.sh .

COPY install_packages.R .

COPY philadelphia_property_analysis_cleaning.R .

# Just in case the script doesn't have the executable bit set
RUN chmod +x ./script.sh

# Run the script when starting the container
CMD [ "./script.sh" ]