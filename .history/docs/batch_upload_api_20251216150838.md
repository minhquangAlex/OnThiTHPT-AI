# Batch Upload API Documentation

## Endpoint
`POST /api/questions/batch`

## Description
This API allows administrators to upload multiple questions in a single request. The questions can be provided in JSON or CSV format.

## Request Headers
- `Authorization`: Bearer token is required for authentication.
- `Content-Type`: `application/json` or `multipart/form-data` (for file uploads).

## Request Body (JSON Example)
```json
{
  "questions": [
    {
      "subjectId": "64b5f2c2e4b0a5d6f8e4a123",
      "type": "multiple_choice",
      "questionText": "What is 2+2?",
      "options": {
        "A": "3",
        "B": "4",
        "C": "5",
        "D": "6"
      },
      "correctAnswer": "B"
    }
  ]
}
```

## Response
### Success
- **Status Code**: `201 Created`
- **Body**:
```json
{
  "success": true,
  "data": [
    {
      "_id": "64b5f2c2e4b0a5d6f8e4a456",
      "subjectId": "64b5f2c2e4b0a5d6f8e4a123",
      "type": "multiple_choice",
      "questionText": "What is 2+2?",
      "options": {
        "A": "3",
        "B": "4",
        "C": "5",
        "D": "6"
      },
      "correctAnswer": "B"
    }
  ],
  "message": "Batch upload successful"
}
```

### Error
- **Status Code**: `400 Bad Request`
- **Body**:
```json
{
  "success": false,
  "message": "Invalid or empty questions array"
}
```

## Frontend Integration
Use the `BatchUpload` component to upload files directly from the user interface. Ensure the `Authorization` header contains a valid token.

## Notes
- Ensure the `subjectId` is valid and exists in the database.
- Validate the file format before uploading.