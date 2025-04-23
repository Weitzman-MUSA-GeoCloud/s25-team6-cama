# Setup and Libraries
library(dplyr)
library(lubridate)

# Load data
df <- read.csv("opa_properties_public.csv")
options(scipen = 999)

# Inspect structure of df (fix typo here)
str(df)

# Set random seed for reproducibility
set.seed(42)

# Split into train and test sets
sample <- sample(c(TRUE, FALSE), nrow(df), replace = TRUE, prob = c(0.7, 0.3))
train  <- df[sample, ]
test   <- df[!sample, ]

# Fit the model on the training data
model <- lm(sale_price ~ basements + census_tract, data = train)

# Predict using the model on the entire dataset (df)
pred <- predict(model, newdata = df)
pred <- data.frame(predicted_value = pred)

# Combine predictions with the original dataset
final_data <- df %>%
  cbind(pred) %>%
  mutate(predicted_at = Sys.Date())

# Save the final dataset with predictions
final_data %>%
  select(property_id, predicted_value, predicted_at) %>%
  write.csv("opa_properties_with_predictions.csv", row.names = FALSE)
