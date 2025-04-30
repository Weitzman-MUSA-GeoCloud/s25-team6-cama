# Setup and Libraries
library(dplyr)
library(tidyr)

# Load data
df <- read.csv("opa_properties_public.csv")
options(scipen = 999)

df$sale_price_log<- log1p(df$sale_price)
df$market_value_log<- log1p(df$market_value)
# Inspect structure of df (fix typo here)
str(df)

# Set random seed for reproducibility
set.seed(42)

# Split into train and test sets
sample <- sample(c(TRUE, FALSE), nrow(df), replace = TRUE, prob = c(0.7, 0.3))
train  <- df[sample, ]
test   <- df[!sample, ]


# Fit the model on the training data
model <- lm(sale_price_log ~ market_value_log+ number_of_bathrooms+year_built+total_livable_area+depth+interior_condition , data = train)

# Predict using the model on the entire dataset (df)
pred <- predict(model, newdata = df)
pred <- data.frame(predicted_value = round(pred, digits =2))

# Combine predictions with the original dataset
final_data <- df %>%
  cbind(pred) %>%
  mutate(predicted_at = 2026,
  predicted_value= replace_na(predicted_value, -999))%>%
  mutate(predicted_value= round(expm1(predicted_value),3))

# Save the final dataset with predictions
final_data %>%
  select(property_id, predicted_value, predicted_at) %>%
  write.csv("opa_properties_with_predictions.csv", row.names = FALSE,quote = FALSE)
