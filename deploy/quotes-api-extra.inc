location ~ ^/api/ifq/(?:calendar/(?:bonds|dividends|key-rate)|instruments|quotes/current)$ {
  default_type application/json;
  return 503 "{\"error\":\"token_not_configured\"}";
}
