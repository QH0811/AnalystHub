from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware

import pandas as pd
import numpy as np


# ==================================================
# APP SETUP
# ==================================================

app = FastAPI(
    title="AnalystHub API",
    description="Backend API for AnalystHub",
    version="1.0.0"
)


# ==================================================
# CORS
# ==================================================

app.add_middleware(
    CORSMiddleware,

    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],

    allow_credentials=True,

    allow_methods=["*"],

    allow_headers=["*"],
)


# ==================================================
# CURRENT DATASET
# ==================================================

current_dataframe = None


# ==================================================
# HELPER - COLUMN TYPE
# ==================================================

def get_column_type(column):

    # Numeric
    if pd.api.types.is_numeric_dtype(column):

        return "numeric"


    # Date / Time
    if pd.api.types.is_datetime64_any_dtype(column):

        return "date"


    # Categorical
    if isinstance(
        column.dtype,
        pd.CategoricalDtype
    ):

        return "categorical"


    # Text
    if pd.api.types.is_string_dtype(column):

        unique_count = column.nunique(
            dropna=True
        )

        total_count = len(column)

        # Text with many unique values
        # is treated as text.
        if total_count > 0:

            unique_ratio = (
                unique_count /
                total_count
            )

            if unique_ratio > 0.5:

                return "text"


        return "categorical"


    # Other
    return "other"


# ==================================================
# HOME
# ==================================================

@app.get("/")
def home():

    return {
        "message": "AnalystHub API is running"
    }


# ==================================================
# UPLOAD DATASET
# ==================================================

@app.post("/upload")
async def upload_dataset(
    file: UploadFile = File(...)
):

    global current_dataframe


    filename = file.filename.lower()


    # ----------------------------------------------
    # CSV
    # ----------------------------------------------

    if filename.endswith(".csv"):

        df = pd.read_csv(
            file.file
        )


    # ----------------------------------------------
    # Excel
    # ----------------------------------------------

    elif (
        filename.endswith(".xlsx")
        or filename.endswith(".xls")
    ):

        df = pd.read_excel(
            file.file
        )


    # ----------------------------------------------
    # Unsupported
    # ----------------------------------------------

    else:

        return {
            "error":
            "Only CSV and Excel files are supported."
        }


    # ----------------------------------------------
    # Try to detect date columns
    # ----------------------------------------------

    for column in df.columns:

        # Only try object/string columns
        if (
            df[column].dtype == "object"
            or
            pd.api.types.is_string_dtype(
                df[column]
            )
        ):

            converted = pd.to_datetime(
                df[column],
                errors="coerce"
            )

            valid_ratio = (
                converted.notna().mean()
            )


            # If most values can be
            # interpreted as dates
            if valid_ratio >= 0.8:

                df[column] = converted


    # Store dataset
    current_dataframe = df


    # ----------------------------------------------
    # Return summary
    # ----------------------------------------------

    return {

        "filename":
        file.filename,

        "rows":
        len(df),

        "columns":
        len(df.columns),

        "missing_values":
        int(
            df.isna().sum().sum()
        ),

        "duplicate_rows":
        int(
            df.duplicated().sum()
        )

    }


# ==================================================
# DATA PROFILE
# ==================================================

@app.get("/profile")
def get_profile():

    # Check dataset
    if current_dataframe is None:

        return {
            "error":
            "No dataset has been uploaded yet"
        }


    df = current_dataframe


    # ----------------------------------------------
    # Column information
    # ----------------------------------------------

    column_info = []


    for column in df.columns:

        column_data = df[column]

        data_type = get_column_type(
            column_data
        )


        information = {

            "name":
            column,

            "data_type":
            data_type,

            "missing_values":
            int(
                column_data.isna().sum()
            ),

            "unique_values":
            int(
                column_data.nunique()
            )

        }


        # ------------------------------------------
        # Numeric statistics
        # ------------------------------------------

        if data_type == "numeric":

            clean_data = (
                column_data
                .dropna()
            )


            if len(clean_data) > 0:

                std_value = (
                    clean_data.std()
                )


                information[
                    "statistics"
                ] = {

                    "type":
                    "numeric",

                    "mean":
                    round(
                        float(
                            clean_data.mean()
                        ),
                        2
                    ),

                    "median":
                    round(
                        float(
                            clean_data.median()
                        ),
                        2
                    ),

                    "minimum":
                    round(
                        float(
                            clean_data.min()
                        ),
                        2
                    ),

                    "maximum":
                    round(
                        float(
                            clean_data.max()
                        ),
                        2
                    ),

                    "standard_deviation":
                    (
                        round(
                            float(
                                std_value
                            ),
                            2
                        )
                        if pd.notna(
                            std_value
                        )
                        else None
                    )

                }

            else:

                information[
                    "statistics"
                ] = {

                    "type":
                    "numeric",

                    "mean": None,

                    "median": None,

                    "minimum": None,

                    "maximum": None,

                    "standard_deviation":
                    None

                }


        # ------------------------------------------
        # Categorical statistics
        # ------------------------------------------

        elif data_type == "categorical":

            mode = (
                column_data
                .dropna()
                .mode()
            )


            information[
                "statistics"
            ] = {

                "type":
                "categorical",

                "most_common":
                (
                    str(
                        mode.iloc[0]
                    )
                    if not mode.empty
                    else None
                )

            }


        # ------------------------------------------
        # Date statistics
        # ------------------------------------------

        elif data_type == "date":

            clean_data = (
                column_data
                .dropna()
            )


            if len(clean_data) > 0:

                information[
                    "statistics"
                ] = {

                    "type":
                    "date",

                    "earliest":
                    str(
                        clean_data.min()
                    ),

                    "latest":
                    str(
                        clean_data.max()
                    )

                }


        # ------------------------------------------
        # Text
        # ------------------------------------------

        elif data_type == "text":

            information[
                "statistics"
            ] = {

                "type":
                "text",

                "unique_values":
                int(
                    column_data.nunique()
                )

            }


        # ------------------------------------------
        # Other
        # ------------------------------------------

        else:

            information[
                "statistics"
            ] = {

                "type":
                "other"

            }


        column_info.append(
            information
        )


    return {

        "rows":
        len(df),

        "columns":
        len(df.columns),

        "missing_values":
        int(
            df.isna().sum().sum()
        ),

        "duplicate_rows":
        int(
            df.duplicated().sum()
        ),

        "column_info":
        column_info

    }


# ==================================================
# DATA CLEANING INFORMATION
# ==================================================

@app.get("/cleaning")
def get_cleaning_info():

    if current_dataframe is None:

        return {
            "error":
            "No dataset has been uploaded yet"
        }


    df = current_dataframe


    # ----------------------------------------------
    # Missing columns
    # ----------------------------------------------

    missing_columns = []


    for column in df.columns:

        missing_count = int(
            df[column].isna().sum()
        )


        if missing_count > 0:

            percentage = 0

            if len(df) > 0:

                percentage = round(
                    (
                        missing_count /
                        len(df)
                    ) * 100,
                    2
                )


            missing_columns.append({

                "name":
                column,

                "data_type":
                get_column_type(
                    df[column]
                ),

                "missing_count":
                missing_count,

                "missing_percentage":
                percentage

            })


    # ----------------------------------------------
    # Duplicates
    # ----------------------------------------------

    duplicate_count = int(
        df.duplicated().sum()
    )


    return {

        "rows":
        len(df),

        "columns":
        len(df.columns),

        "missing_values":
        int(
            df.isna().sum().sum()
        ),

        "duplicate_rows":
        duplicate_count,

        "missing_columns":
        missing_columns

    }


# ==================================================
# PREVIEW MISSING VALUE CLEANING
# ==================================================

@app.post("/cleaning/preview")
async def preview_cleaning(
    request: dict
):

    if current_dataframe is None:

        return {
            "error":
            "No dataset has been uploaded yet"
        }


    column = request.get(
        "column"
    )

    method = request.get(
        "method"
    )

    custom_value = request.get(
        "custom_value"
    )


    df = current_dataframe


    # Check column
    if column not in df.columns:

        return {
            "error":
            "Selected column does not exist."
        }


    missing_count = int(
        df[column].isna().sum()
    )


    if missing_count == 0:

        return {
            "error":
            "This column does not contain missing values."
        }


    replacement_value = None


    # ----------------------------------------------
    # Mean
    # ----------------------------------------------

    if method == "mean":

        if not pd.api.types.is_numeric_dtype(
            df[column]
        ):

            return {
                "error":
                "Mean can only be used with numeric columns."
            }


        value = df[column].mean()


        if pd.isna(value):

            return {
                "error":
                "Unable to calculate the mean."
            }


        replacement_value = round(
            float(value),
            2
        )


    # ----------------------------------------------
    # Median
    # ----------------------------------------------

    elif method == "median":

        if not pd.api.types.is_numeric_dtype(
            df[column]
        ):

            return {
                "error":
                "Median can only be used with numeric columns."
            }


        value = df[column].median()


        if pd.isna(value):

            return {
                "error":
                "Unable to calculate the median."
            }


        replacement_value = round(
            float(value),
            2
        )


    # ----------------------------------------------
    # Mode
    # ----------------------------------------------

    elif method == "mode":

        mode = (
            df[column]
            .dropna()
            .mode()
        )


        if mode.empty:

            return {
                "error":
                "Unable to determine the mode."
            }


        replacement_value = str(
            mode.iloc[0]
        )


    # ----------------------------------------------
    # Custom
    # ----------------------------------------------

    elif method == "custom":

        if (
            custom_value is None
            or
            str(custom_value).strip() == ""
        ):

            return {
                "error":
                "Please enter a custom value."
            }


        replacement_value = (
            custom_value
        )


    # ----------------------------------------------
    # Remove rows
    # ----------------------------------------------

    elif method == "remove":

        replacement_value = (
            "Rows containing missing values "
            "will be removed."
        )


    else:

        return {
            "error":
            "Invalid cleaning method."
        }


    return {

        "column":
        column,

        "method":
        method,

        "missing_before":
        missing_count,

        "replacement_value":
        replacement_value,

        "rows_before":
        len(df),

        "rows_after":
        (
            len(df) - missing_count
            if method == "remove"
            else len(df)
        )

    }


# ==================================================
# APPLY MISSING VALUE CLEANING
# ==================================================

@app.post("/cleaning/apply")
async def apply_cleaning(
    request: dict
):

    global current_dataframe


    if current_dataframe is None:

        return {
            "error":
            "No dataset has been uploaded yet"
        }


    column = request.get(
        "column"
    )

    method = request.get(
        "method"
    )

    custom_value = request.get(
        "custom_value"
    )


    df = current_dataframe


    if column not in df.columns:

        return {
            "error":
            "Selected column does not exist."
        }


    missing_before = int(
        df[column].isna().sum()
    )


    if missing_before == 0:

        return {
            "error":
            "This column does not contain missing values."
        }


    # ----------------------------------------------
    # Mean
    # ----------------------------------------------

    if method == "mean":

        if not pd.api.types.is_numeric_dtype(
            df[column]
        ):

            return {
                "error":
                "Mean can only be used with numeric columns."
            }


        value = df[column].mean()


        if pd.isna(value):

            return {
                "error":
                "Unable to calculate the mean."
            }


        current_dataframe[column] = (
            df[column]
            .fillna(value)
        )


    # ----------------------------------------------
    # Median
    # ----------------------------------------------

    elif method == "median":

        if not pd.api.types.is_numeric_dtype(
            df[column]
        ):

            return {
                "error":
                "Median can only be used with numeric columns."
            }


        value = df[column].median()


        if pd.isna(value):

            return {
                "error":
                "Unable to calculate the median."
            }


        current_dataframe[column] = (
            df[column]
            .fillna(value)
        )


    # ----------------------------------------------
    # Mode
    # ----------------------------------------------

    elif method == "mode":

        mode = (
            df[column]
            .dropna()
            .mode()
        )


        if mode.empty:

            return {
                "error":
                "Unable to determine the mode."
            }


        value = mode.iloc[0]


        current_dataframe[column] = (
            df[column]
            .fillna(value)
        )


    # ----------------------------------------------
    # Custom
    # ----------------------------------------------

    elif method == "custom":

        if (
            custom_value is None
            or
            str(custom_value).strip() == ""
        ):

            return {
                "error":
                "Please enter a custom value."
            }


        # Convert custom value for numeric columns
        if pd.api.types.is_numeric_dtype(
            df[column]
        ):

            try:

                custom_value = float(
                    custom_value
                )

            except ValueError:

                return {
                    "error":
                    "Please enter a numeric value."
                }


        current_dataframe[column] = (
            df[column]
            .fillna(custom_value)
        )


    # ----------------------------------------------
    # Remove
    # ----------------------------------------------

    elif method == "remove":

        current_dataframe = (
            df.dropna(
                subset=[column]
            )
        )


    else:

        return {
            "error":
            "Invalid cleaning method."
        }


    return {

        "message":
        f"Cleaning applied to '{column}'.",

        "rows":
        len(current_dataframe),

        "columns":
        len(
            current_dataframe.columns
        ),

        "missing_values":
        int(
            current_dataframe
            .isna()
            .sum()
            .sum()
        ),

        "duplicate_rows":
        int(
            current_dataframe
            .duplicated()
            .sum()
        )

    }


# ==================================================
# PREVIEW DUPLICATE ROWS
# ==================================================

@app.get("/cleaning/duplicates")
def get_duplicates():

    if current_dataframe is None:

        return {
            "error":
            "No dataset has been uploaded yet"
        }


    df = current_dataframe


    duplicate_df = df[
        df.duplicated(
            keep=False
        )
    ].copy()


    # ----------------------------------------------
    # Add duplicate occurrence count
    # ----------------------------------------------

    if len(duplicate_df) > 0:

        duplicate_df[
            "_duplicate_count"
        ] = (
            duplicate_df
            .groupby(
                list(df.columns),
                dropna=False
            )[df.columns[0]]
            .transform("size")
        )


    rows = (
        duplicate_df
        .fillna("")
        .astype(str)
        .to_dict(
            orient="records"
        )
    )


    return {

        "count":
        int(
            df.duplicated().sum()
        ),

        "rows":
        rows

    }


# ==================================================
# REMOVE DUPLICATES
# ==================================================

@app.post("/cleaning/duplicates/remove")
def remove_duplicates():

    global current_dataframe


    if current_dataframe is None:

        return {
            "error":
            "No dataset has been uploaded yet"
        }


    before = len(
        current_dataframe
    )


    current_dataframe = (
        current_dataframe
        .drop_duplicates()
    )


    after = len(
        current_dataframe
    )


    removed = (
        before - after
    )


    return {

        "message":
        f"{removed} duplicate row(s) removed.",

        "rows":
        after,

        "columns":
        len(
            current_dataframe.columns
        ),

        "missing_values":
        int(
            current_dataframe
            .isna()
            .sum()
            .sum()
        ),

        "duplicate_rows":
        int(
            current_dataframe
            .duplicated()
            .sum()
        )

    }


# ==================================================
# DATA ANALYSIS
# ==================================================

@app.get("/analysis")
def get_analysis():

    if current_dataframe is None:

        return {
            "error":
            "No dataset has been uploaded yet"
        }


    df = current_dataframe


    numeric_columns = []

    categorical_columns = []

    date_columns = []

    text_columns = []

    other_columns = []


    # ----------------------------------------------
    # Classify columns
    # ----------------------------------------------

    for column in df.columns:

        data_type = get_column_type(
            df[column]
        )


        if data_type == "numeric":

            numeric_columns.append(
                column
            )

        elif data_type == "categorical":

            categorical_columns.append(
                column
            )

        elif data_type == "date":

            date_columns.append(
                column
            )

        elif data_type == "text":

            text_columns.append(
                column
            )

        else:

            other_columns.append(
                column
            )


    # ----------------------------------------------
    # Numeric analysis
    # ----------------------------------------------

    numeric_analysis = []


    for column in numeric_columns:

        column_data = df[column]

        clean_data = (
            column_data
            .dropna()
        )


        if len(clean_data) == 0:

            continue


        std_value = (
            clean_data.std()
        )


        numeric_analysis.append({

            "name":
            column,

            "mean":
            round(
                float(
                    clean_data.mean()
                ),
                2
            ),

            "median":
            round(
                float(
                    clean_data.median()
                ),
                2
            ),

            "minimum":
            round(
                float(
                    clean_data.min()
                ),
                2
            ),

            "maximum":
            round(
                float(
                    clean_data.max()
                ),
                2
            ),

            "standard_deviation":
            (
                round(
                    float(
                        std_value
                    ),
                    2
                )
                if pd.notna(
                    std_value
                )
                else None
            ),

            "missing_values":
            int(
                column_data.isna().sum()
            )

        })


    # ----------------------------------------------
    # Categorical analysis
    # ----------------------------------------------

    categorical_analysis = []


    for column in categorical_columns:

        column_data = df[column]


        value_counts = (
            column_data
            .dropna()
            .value_counts()
        )


        if len(value_counts) > 0:

            most_common = str(
                value_counts
                .index[0]
            )

            most_common_count = int(
                value_counts
                .iloc[0]
            )

        else:

            most_common = "N/A"

            most_common_count = 0


        categorical_analysis.append({

            "name":
            column,

            "unique_values":
            int(
                column_data
                .nunique()
            ),

            "most_common":
            most_common,

            "most_common_count":
            most_common_count,

            "missing_values":
            int(
                column_data
                .isna()
                .sum()
            )

        })


    # ----------------------------------------------
    # Column information
    # ----------------------------------------------

    column_info = []


    for column in df.columns:

        data_type = get_column_type(
            df[column]
        )


        column_info.append({

            "name":
            column,

            "data_type":
            data_type,

            "missing_values":
            int(
                df[column]
                .isna()
                .sum()
            ),

            "unique_values":
            int(
                df[column]
                .nunique()
            )

        })


    return {

        "rows":
        len(df),

        "columns":
        len(df.columns),

        "numeric_columns":
        numeric_columns,

        "categorical_columns":
        categorical_columns,

        "date_columns":
        date_columns,

        "text_columns":
        text_columns,

        "other_columns":
        other_columns,

        "numeric_analysis":
        numeric_analysis,

        "categorical_analysis":
        categorical_analysis,

        "column_info":
        column_info

    }


# ==================================================
# SELECTED COLUMN ANALYSIS
# ==================================================

@app.get(
    "/analysis/column/{column_name}"
)
def analyze_selected_column(
    column_name: str
):

    if current_dataframe is None:

        return {
            "error":
            "No dataset has been uploaded yet"
        }


    df = current_dataframe


    if column_name not in df.columns:

        return {
            "error":
            "Column does not exist."
        }


    column_data = df[column_name]

    data_type = get_column_type(
        column_data
    )


    missing_values = int(
        column_data.isna().sum()
    )


    unique_values = int(
        column_data.nunique()
    )


    # ==================================================
    # NUMERIC
    # ==================================================

    if data_type == "numeric":

        clean_data = (
            column_data
            .dropna()
        )


        if len(clean_data) == 0:

            return {

                "name":
                column_name,

                "data_type":
                "numeric",

                "missing_values":
                missing_values,

                "unique_values":
                unique_values,

                "statistics":
                None,

                "histogram":
                []

            }


        std_value = (
            clean_data.std()
        )


        # ------------------------------------------
        # Histogram
        # ------------------------------------------

        histogram = []


        if clean_data.nunique() <= 1:

            histogram = [{

                "range":
                str(
                    round(
                        float(
                            clean_data.iloc[0]
                        ),
                        2
                    )
                ),

                "count":
                int(
                    len(clean_data)
                )

            }]

        else:

            binned, bin_edges = pd.cut(

                clean_data,

                bins=10,

                include_lowest=True,

                retbins=True

            )


            frequency = (
                binned
                .value_counts(
                    sort=False
                )
            )


            for interval, count in (
                frequency.items()
            ):

                histogram.append({

                    "range":
                    str(interval),

                    "count":
                    int(count)

                })


        return {

            "name":
            column_name,

            "data_type":
            "numeric",

            "missing_values":
            missing_values,

            "unique_values":
            unique_values,

            "statistics": {

                "mean":
                round(
                    float(
                        clean_data.mean()
                    ),
                    2
                ),

                "median":
                round(
                    float(
                        clean_data.median()
                    ),
                    2
                ),

                "minimum":
                round(
                    float(
                        clean_data.min()
                    ),
                    2
                ),

                "maximum":
                round(
                    float(
                        clean_data.max()
                    ),
                    2
                ),

                "standard_deviation":
                (
                    round(
                        float(
                            std_value
                        ),
                        2
                    )
                    if pd.notna(
                        std_value
                    )
                    else None
                )

            },

            "histogram":
            histogram

        }


    # ==================================================
    # CATEGORICAL
    # ==================================================

    if data_type == "categorical":

        frequency = (
            column_data
            .fillna("Missing")
            .value_counts()
            .head(10)
        )


        categories = []


        for value, count in (
            frequency.items()
        ):

            categories.append({

                "value":
                str(value),

                "count":
                int(count)

            })


        return {

            "name":
            column_name,

            "data_type":
            "categorical",

            "missing_values":
            missing_values,

            "unique_values":
            unique_values,

            "frequency":
            categories

        }


    # ==================================================
    # DATE
    # ==================================================

    if data_type == "date":

        clean_data = (
            column_data
            .dropna()
        )


        if len(clean_data) == 0:

            return {

                "name":
                column_name,

                "data_type":
                "date",

                "missing_values":
                missing_values,

                "unique_values":
                unique_values,

                "date_information":
                None

            }


        return {

            "name":
            column_name,

            "data_type":
            "date",

            "missing_values":
            missing_values,

            "unique_values":
            unique_values,

            "date_information": {

                "earliest":
                str(
                    clean_data.min()
                ),

                "latest":
                str(
                    clean_data.max()
                )

            }

        }


    # ==================================================
    # TEXT
    # ==================================================

    if data_type == "text":

        return {

            "name":
            column_name,

            "data_type":
            "text",

            "missing_values":
            missing_values,

            "unique_values":
            unique_values

        }


    # ==================================================
    # OTHER
    # ==================================================

    return {

        "name":
        column_name,

        "data_type":
        "other",

        "missing_values":
        missing_values,

        "unique_values":
        unique_values

    }


# ==================================================
# CHART DATA
# ==================================================

@app.get("/analysis/chart")
def get_chart_data(

    chart_type: str,

    x_column: str,

    y_column: str = None

):

    if current_dataframe is None:

        return {
            "error":
            "No dataset has been uploaded yet"
        }


    df = current_dataframe


    # ----------------------------------------------
    # Check X column
    # ----------------------------------------------

    if x_column not in df.columns:

        return {
            "error":
            "X-axis column does not exist."
        }


    # ==================================================
    # HISTOGRAM
    # ==================================================

    if chart_type == "histogram":

        if get_column_type(
            df[x_column]
        ) != "numeric":

            return {
                "error":
                "Histogram requires a numeric column."
            }


        clean_data = (
            df[x_column]
            .dropna()
        )


        if len(clean_data) == 0:

            return {
                "error":
                "No usable numeric data."
            }


        data = []


        if clean_data.nunique() <= 1:

            data.append({

                "range":
                str(
                    round(
                        float(
                            clean_data.iloc[0]
                        ),
                        2
                    )
                ),

                "count":
                int(
                    len(clean_data)
                )

            })

        else:

            binned = pd.cut(
                clean_data,
                bins=10,
                include_lowest=True
            )


            frequency = (
                binned
                .value_counts(
                    sort=False
                )
            )


            for interval, count in (
                frequency.items()
            ):

                data.append({

                    "range":
                    str(interval),

                    "count":
                    int(count)

                })


        return {

            "chart_type":
            "histogram",

            "data":
            data

        }


    # ==================================================
    # BAR CHART
    # ==================================================

    if chart_type == "bar":

        if get_column_type(
            df[x_column]
        ) not in [
            "categorical",
            "text"
        ]:

            return {
                "error":
                "Bar Chart requires a categorical column."
            }


        frequency = (
            df[x_column]
            .fillna("Missing")
            .value_counts()
            .head(10)
        )


        data = []


        for value, count in (
            frequency.items()
        ):

            data.append({

                "value":
                str(value),

                "count":
                int(count)

            })


        return {

            "chart_type":
            "bar",

            "data":
            data

        }


    # ==================================================
    # PIE CHART
    # ==================================================

    if chart_type == "pie":

        if get_column_type(
            df[x_column]
        ) not in [
            "categorical",
            "text"
        ]:

            return {
                "error":
                "Pie Chart requires a categorical column."
            }


        frequency = (
            df[x_column]
            .fillna("Missing")
            .value_counts()
            .head(10)
        )


        data = []


        for value, count in (
            frequency.items()
        ):

            data.append({

                "value":
                str(value),

                "count":
                int(count)

            })


        return {

            "chart_type":
            "pie",

            "data":
            data

        }


    # ==================================================
    # SCATTER PLOT
    # ==================================================

    if chart_type == "scatter":

        if y_column is None:

            return {
                "error":
                "Scatter Plot requires X and Y columns."
            }


        if y_column not in df.columns:

            return {
                "error":
                "Y-axis column does not exist."
            }


        if (
            get_column_type(
                df[x_column]
            ) != "numeric"
            or
            get_column_type(
                df[y_column]
            ) != "numeric"
        ):

            return {
                "error":
                "Scatter Plot requires two numeric columns."
            }


        chart_df = df[
            [x_column, y_column]
        ].dropna()


        # Limit points for browser performance
        if len(chart_df) > 5000:

            chart_df = chart_df.sample(
                5000,
                random_state=42
            )


        data = []


        for _, row in (
            chart_df.iterrows()
        ):

            data.append({

                "x":
                float(
                    row[x_column]
                ),

                "y":
                float(
                    row[y_column]
                )

            })


        return {

            "chart_type":
            "scatter",

            "data":
            data

        }


    # ==================================================
    # LINE CHART
    # ==================================================

    if chart_type == "line":

        if y_column is None:

            return {
                "error":
                "Line Chart requires X and Y columns."
            }


        if y_column not in df.columns:

            return {
                "error":
                "Y-axis column does not exist."
            }


        # X must be date
        if get_column_type(
            df[x_column]
        ) != "date":

            return {
                "error":
                "Line Chart requires a date column for the X-axis."
            }


        # Y must be numeric
        if get_column_type(
            df[y_column]
        ) != "numeric":

            return {
                "error":
                "Line Chart requires a numeric column for the Y-axis."
            }


        chart_df = df[
            [x_column, y_column]
        ].dropna()


        if len(chart_df) == 0:

            return {
                "error":
                "No usable data for the line chart."
            }


        # Group by date
        chart_df = (
            chart_df
            .sort_values(x_column)
        )


        # Limit data points
        if len(chart_df) > 500:

            chart_df = (
                chart_df
                .set_index(x_column)
                .resample("D")[y_column]
                .mean()
                .dropna()
                .reset_index()
            )


        data = []


        for _, row in (
            chart_df.iterrows()
        ):

            data.append({

                "date":
                row[x_column]
                .strftime("%Y-%m-%d"),

                "value":
                round(
                    float(
                        row[y_column]
                    ),
                    2
                )

            })


        return {

            "chart_type":
            "line",

            "data":
            data

        }


    # ==================================================
    # INVALID CHART
    # ==================================================

    return {

        "error":
        "Unsupported chart type."

    }