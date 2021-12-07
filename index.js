const core = require('@actions/core')
const { Octokit } = require('@octokit/core');
const fetchIssuesStat = require('./feature-stats-fetcher')

const octokit = new Octokit({ auth: core.getInput('gh_token') });

(
    async () => {

        try{
            const username = process.env.GITHUB_REPOSITORY.split("/")[0]
            const repo = process.env.GITHUB_REPOSITORY.split("/")[1]

            console.log("Hello", username,  ", the workflow is being deployed in the", repo, "repo")

            const stats = await fetchIssuesStat();

            const markdown =`| Issue Statistics | Values |
            | - | :-: |
            | Closed Issues 📪 | ${stats.closed} |
            | Open Issues 📫 | ${stats.open} |
            | Total Issues 🔢 | ${stats.total} |
            | Replied Issues ☑ | ${stats.replied} |
            | Not Replied Issues ➖ | ${stats.noReply} |
            | Avg. Issue Response Time ⏱ | ${stats.rate !== undefined ? (stats.rate,"mins") : "NA" } |
            `
            const getReadme = await octokit.request('GET /repos/{owner}/{repo}/contents/{path}', {
                owner: username,
                repo: repo,
                path: core.getInput('readme_path'),
              }).then( res => { 
                return res.data
              }     
              ).catch(e => {
                console.error("Failed:", e.message, "🔔")
                // core.setFailed("Failed: ", e.message)
              }
            )   

            const sha = getReadme() 

            await octokit.request('PUT /repos/{owner}/{repo}/contents/{path}', {
              owner: username,
              repo: repo,
              path: core.getInput('readme_path'),
              message: '(Automated) Update README.md',
              content: Buffer.from(markdown, "utf8").toString('base64'),
              sha: sha,
            }).then(() => {
              core.setOutput("result", (markdown))
            }).catch((e) => {
              console.error("Failed: ", e.message, "🔔")
            //   core.setFailed("Failed: ", e.message)
            })

        }catch(error){
            core.setFailed(error.message);
        }

    }
)()