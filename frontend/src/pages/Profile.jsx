import {
  useEffect,
  useState
} from "react";


function Profile() {

  const [profile, setProfile] =
    useState(null);

  const [error, setError] =
    useState("");

  const [selectedColumn, setSelectedColumn] =
    useState(null);


  // Get dataset profile
  useEffect(() => {

    fetch(
      "http://127.0.0.1:8000/profile"
    )

      .then((response) =>
        response.json()
      )

      .then((data) => {

        if (data.error) {

          setError(data.error);

        } else {

          setProfile(data);

          if (
            data.column_info.length > 0
          ) {

            setSelectedColumn(
              data.column_info[0]
            );

          }

        }

      })

      .catch(() => {

        setError(
          "Unable to connect to the AnalystHub API."
        );

      });

  }, []);


  // Error
  if (error) {

    return (
      <div className="profile-page">

        <div className="page-header">

          <h1>
            Data Profile
          </h1>

          <p>
            Understand the structure and quality
            of your dataset.
          </p>

        </div>


        <div className="profile-error">
          {error}
        </div>

      </div>
    );

  }


  // Loading
  if (!profile) {

    return (
      <div className="profile-page">

        <div className="page-header">

          <h1>
            Data Profile
          </h1>

          <p>
            Loading dataset profile...
          </p>

        </div>

      </div>
    );

  }


  return (
    <div className="profile-page">


      {/* Header */}
      <div className="page-header">

        <h1>
          Data Profile
        </h1>

        <p>
          Understand the structure and quality
          of your dataset.
        </p>

      </div>


      {/* Summary */}
      <div className="metrics">

        <div className="metric-card">

          <span className="metric-label">
            Rows
          </span>

          <strong>
            {profile.rows}
          </strong>

          <small>
            Total records
          </small>

        </div>


        <div className="metric-card">

          <span className="metric-label">
            Columns
          </span>

          <strong>
            {profile.columns}
          </strong>

          <small>
            Variables
          </small>

        </div>


        <div className="metric-card">

          <span className="metric-label">
            Missing Values
          </span>

          <strong>
            {profile.missing_values}
          </strong>

          <small>
            Need attention
          </small>

        </div>


        <div className="metric-card">

          <span className="metric-label">
            Duplicates
          </span>

          <strong>
            {profile.duplicate_rows}
          </strong>

          <small>
            Duplicate rows
          </small>

        </div>

      </div>


      {/* Column Overview */}
      <div className="profile-table-card">

        <div className="profile-table-header">

          <h2>
            Column Overview
          </h2>

          <p>
            Select a column to view its statistics.
          </p>

        </div>


        <table>

          <thead>

            <tr>

              <th>
                Column
              </th>

              <th>
                Data Type
              </th>

              <th>
                Missing Values
              </th>

              <th>
                Unique Values
              </th>

            </tr>

          </thead>


          <tbody>

            {profile.column_info.map(
              (column) => (

                <tr
                  key={column.name}
                  onClick={() =>
                    setSelectedColumn(column)
                  }
                  className={
                    selectedColumn?.name ===
                    column.name
                      ? "selected-row"
                      : ""
                  }
                >

                  <td>
                    {column.name}
                  </td>

                  <td>

                    <span className="data-type">
                      {column.data_type}
                    </span>

                  </td>

                  <td>
                    {column.missing_values}
                  </td>

                  <td>
                    {column.unique_values}
                  </td>

                </tr>

              )
            )}

          </tbody>

        </table>

      </div>


      {/* Statistics */}
      {selectedColumn && (

        <div className="statistics-card">

          <div className="statistics-header">

            <div>

              <h2>
                {selectedColumn.name}
              </h2>

              <p>
                Column statistics
              </p>

            </div>


            <span className="data-type">
              {selectedColumn.data_type}
            </span>

          </div>


          <div className="statistics-grid">

            {selectedColumn.statistics.type ===
            "numeric" ? (

              <>

                <div className="stat-item">

                  <span>
                    Mean
                  </span>

                  <strong>
                    {selectedColumn.statistics.mean}
                  </strong>

                </div>


                <div className="stat-item">

                  <span>
                    Median
                  </span>

                  <strong>
                    {selectedColumn.statistics.median}
                  </strong>

                </div>


                <div className="stat-item">

                  <span>
                    Minimum
                  </span>

                  <strong>
                    {selectedColumn.statistics.minimum}
                  </strong>

                </div>


                <div className="stat-item">

                  <span>
                    Maximum
                  </span>

                  <strong>
                    {selectedColumn.statistics.maximum}
                  </strong>

                </div>


                <div className="stat-item">

                  <span>
                    Standard Deviation
                  </span>

                  <strong>
                    {
                      selectedColumn.statistics
                        .standard_deviation
                    }
                  </strong>

                </div>

              </>

            ) : (

              <div className="stat-item">

                <span>
                  Most Common Value
                </span>

                <strong>
                  {
                    selectedColumn.statistics
                      .most_common ||
                    "N/A"
                  }
                </strong>

              </div>

            )}

          </div>

        </div>

      )}

    </div>
  );
}


export default Profile;